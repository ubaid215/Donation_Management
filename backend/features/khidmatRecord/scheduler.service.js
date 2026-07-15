// ============================================================
// features/khidmatRecord/scheduler.service.js
// FIXED - Proper, host-timezone-independent scheduling
//
// NOTE: `process.env.TZ = 'Asia/Karachi'` used to sit at the top of
// this file to try to force local time math into Pakistan time.
// That doesn't reliably work — Node/V8 caches the local-time offset
// the first time `Date` does any local-time computation, so setting
// process.env.TZ at runtime (especially after other modules such as
// khidmat.service.js may already have touched Date) can silently be
// a no-op, and the host's real default timezone (often UTC in
// containers) leaks through instead. That's what was causing
// nextRunAt to drift away from the HH:mm an admin actually typed.
// It has been removed — see utils/scheduleTime.js for the real fix.
// ============================================================

import cron from 'node-cron'
import prisma from '../../config/prisma.js'
import { sendBulkReminders } from '../../utils/bulkReminderWhatsApp.js'
import { createAuditLog } from '../../utils/auditLogger.js'
import { calculateNextRun } from '../../utils/scheduleTime.js'

// ─────────────────────────────────────────────
// Scheduler Configuration - RUNS EVERY MINUTE
// ─────────────────────────────────────────────
const SCHEDULER_CONFIG = {
  // Run every minute - FOR TESTING
  DEFAULT_SCHEDULE: '* * * * *',
  // Health check every minute
  HEALTH_CHECK: '* * * * *',
}

// ─────────────────────────────────────────────
// Helper: Convert local (Asia/Karachi) time-of-day to the next UTC
// run instant. Delegates to the single shared implementation in
// utils/scheduleTime.js so this file and khidmat.service.js can
// never drift out of sync again.
// ─────────────────────────────────────────────
const getNextRunUTC = (timeStr, frequency) => calculateNextRun({ time: timeStr, frequency })

// ─────────────────────────────────────────────
// Send Scheduled Reminders
// ─────────────────────────────────────────────
export const sendScheduledReminders = async () => {
  const now = new Date()
  console.log(`🕐 Running scheduled reminder task`)
  console.log(`  📅 Local time: ${now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
  console.log(`  📅 UTC time: ${now.toISOString()}`)
  console.log(`  📅 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  
  try {
    // Get all active schedules that are due (nextRunAt <= now)
    const schedules = await prisma.reminderSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now }
      },
      include: {
        records: {
          where: { status: 'PENDING' },
          include: { 
            record: {
              select: {
                id: true,
                name: true,
                phone: true,
                status: true,
                amount: true,
                receivedAmount: true,
                categoryId: true
              }
            }
          }
        }
      }
    })

    console.log(`📋 Found ${schedules.length} schedules due for execution`)

    if (schedules.length === 0) {
      console.log('📋 No schedules due for execution')
      return { totalSent: 0, totalFailed: 0, schedulesProcessed: 0 }
    }

    let totalSent = 0
    let totalFailed = 0
    let totalSkipped = 0
    let schedulesProcessed = 0

    for (const schedule of schedules) {
      console.log(`  📋 Processing schedule: "${schedule.name}" (ID: ${schedule.id})`)
      console.log(`  📅 Next run (UTC): ${schedule.nextRunAt?.toISOString()}`)
      console.log(`  📅 Next run (Local): ${schedule.nextRunAt?.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
      console.log(`  📅 Current time: ${now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
      
      // Get only pending records with phone numbers
      const pendingRecords = schedule.records.filter(r => r.record && r.record.phone)
      
      console.log(`  📱 Pending records with phones: ${pendingRecords.length} / ${schedule.records.length}`)
      
      if (pendingRecords.length === 0) {
        console.log(`  ⚠️ No pending records with phones, skipping`)
        
        // Update schedule to avoid endless loop
        const nextRunAt = getNextRunUTC(schedule.time || '09:00', schedule.frequency)
        await prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRunAt,
          }
        })
        console.log(`  📅 Next run set to: ${nextRunAt.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
        continue
      }

      const recordIds = pendingRecords.map(r => r.recordId)
      console.log(`  📤 Sending to ${recordIds.length} records...`)
      
      try {
        // Call the working sendBulkReminders function
        const result = await sendBulkReminders({
          recordIds: recordIds,
          userId: schedule.createdBy || 'system',
          userRole: 'ADMIN',
          ipAddress: 'scheduler'
        })

        console.log(`  📊 Result: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`)

        totalSent += result.sent || 0
        totalFailed += result.failed || 0
        totalSkipped += result.skipped || 0
        schedulesProcessed++

        // Update schedule records status
        for (const record of pendingRecords) {
          const resultItem = result.results?.find(r => r.id === record.recordId)
          
          await prisma.reminderScheduleRecord.update({
            where: { id: record.id },
            data: {
              status: resultItem?.status === 'SENT' ? 'SENT' : 
                      resultItem?.status === 'FAILED' ? 'FAILED' : 'PENDING',
              sentAt: resultItem?.status === 'SENT' ? new Date() : null,
              error: resultItem?.status === 'FAILED' ? resultItem.error : null
            }
          })
        }

        // Update schedule last run and next run
        const nextRunAt = getNextRunUTC(schedule.time || '09:00', schedule.frequency)
        await prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRunAt,
          }
        })
        console.log(`  📅 Next run set to: ${nextRunAt.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)

        // Create audit log for this schedule run
        await createAuditLog({
          action: 'REMINDER_SCHEDULE_RUN',
          userId: schedule.createdBy || 'system',
          userRole: 'ADMIN',
          entityType: 'REMINDER_SCHEDULE',
          entityId: schedule.id,
          description: `Scheduled reminder "${schedule.name}" sent: ${result.sent} sent, ${result.failed} failed`,
          metadata: { 
            scheduleId: schedule.id, 
            sent: result.sent, 
            failed: result.failed,
            skipped: result.skipped,
            total: result.total
          },
          ipAddress: 'scheduler'
        })

        console.log(`  ✅ Schedule "${schedule.name}" completed`)

      } catch (error) {
        console.error(`  ❌ Schedule "${schedule.name}" failed:`, error.message)
        console.error(`  Stack:`, error.stack)
        totalFailed += pendingRecords.length
        
        // Update schedule with error
        const nextRunAt = getNextRunUTC(schedule.time || '09:00', schedule.frequency)
        await prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRunAt,
          }
        })
        
        // Log the error
        await createAuditLog({
          action: 'REMINDER_SCHEDULE_ERROR',
          userId: schedule.createdBy || 'system',
          userRole: 'ADMIN',
          entityType: 'REMINDER_SCHEDULE',
          entityId: schedule.id,
          description: `Schedule "${schedule.name}" failed: ${error.message}`,
          metadata: { 
            scheduleId: schedule.id, 
            error: error.message,
            total: pendingRecords.length
          },
          ipAddress: 'scheduler'
        })
      }

      // Add small delay between schedules
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`✅ Scheduled reminders completed: ${totalSent} sent, ${totalFailed} failed, ${totalSkipped} skipped`)
    return { totalSent, totalFailed, totalSkipped, schedulesProcessed }

  } catch (error) {
    console.error('❌ Scheduled reminder task failed:', error)
    console.error('Stack:', error.stack)
    throw error
  }
}

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
const checkOverdueSchedules = async () => {
  try {
    const now = new Date()
    const overdue = await prisma.reminderSchedule.count({
      where: {
        isActive: true,
        nextRunAt: { lte: now }
      }
    })
    
    if (overdue > 0) {
      console.log(`⚠️ ${overdue} schedules are overdue, running now...`)
      await sendScheduledReminders()
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
}

// ─────────────────────────────────────────────
// Initialize Scheduler
// ─────────────────────────────────────────────
export const initScheduler = () => {
  console.log('⏰ Initializing scheduler...')
  console.log(`🕐 Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  console.log(`🕐 Server time (Local): ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
  console.log(`🕐 Server time (UTC): ${new Date().toISOString()}`)

  // Main reminder task - runs every minute
  const mainJob = cron.schedule(SCHEDULER_CONFIG.DEFAULT_SCHEDULE, async () => {
    try {
      console.log(`🕐 Cron job triggered at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`)
      await sendScheduledReminders()
    } catch (error) {
      console.error('❌ Cron job failed:', error)
    }
  })

  // Health check task - runs every minute
  const healthJob = cron.schedule(SCHEDULER_CONFIG.HEALTH_CHECK, async () => {
    try {
      await checkOverdueSchedules()
    } catch (error) {
      console.error('❌ Health check failed:', error)
    }
  })

  console.log('✅ Scheduler initialized')
  console.log(`  📅 Main task: ${SCHEDULER_CONFIG.DEFAULT_SCHEDULE} (Running every minute)`)

  return { mainJob, healthJob }
}

// ─────────────────────────────────────────────
// Stop Scheduler
// ─────────────────────────────────────────────
export const stopScheduler = (jobs) => {
  if (jobs) {
    if (jobs.mainJob) jobs.mainJob.stop()
    if (jobs.healthJob) jobs.healthJob.stop()
    console.log('⏰ Scheduler stopped')
  }
}

// ─────────────────────────────────────────────
// Manual Run
// ─────────────────────────────────────────────
export const runSchedulerManually = async () => {
  console.log('🔄 Manual scheduler run triggered')
  const result = await sendScheduledReminders()
  console.log('📊 Manual run complete:', result)
  return result
}

// ─────────────────────────────────────────────
// Force Update - Update all schedules to run now
// ─────────────────────────────────────────────
export const forceSchedulesToRunNow = async () => {
  console.log('🔄 Force updating all schedules to run now...')
  
  const now = new Date()
  const result = await prisma.reminderSchedule.updateMany({
    where: {
      isActive: true,
    },
    data: {
      nextRunAt: now,
    }
  })
  
  console.log(`✅ Updated ${result.count} schedules to run now`)
  return result
}