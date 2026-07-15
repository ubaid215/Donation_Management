// ============================================================
// features/khidmatRecord/scheduler.service.js
// NEW FILE: Cron job scheduler for auto-reminders
// ============================================================

import cron from 'node-cron'
import prisma from '../../config/prisma.js'
import { sendBulkReminders } from '../../utils/bulkReminderWhatsApp.js'
import { createAuditLog } from '../../utils/auditLogger.js'

// ─────────────────────────────────────────────
// Scheduler Configuration
// ─────────────────────────────────────────────
const SCHEDULER_CONFIG = {
  // Default: Every day at 9 AM and 6 PM
  DEFAULT_SCHEDULE: '0 9,18 * * *',
  // Health check every 5 minutes
  HEALTH_CHECK: '*/5 * * * *',
}

// ─────────────────────────────────────────────
// Send Scheduled Reminders
// ─────────────────────────────────────────────
export const sendScheduledReminders = async () => {
  console.log(`🕐 Running scheduled reminder task at ${new Date().toISOString()}`)
  
  try {
    // Get all active schedules that are due
    const schedules = await prisma.reminderSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: new Date() }
      },
      include: {
        records: {
          where: { status: 'PENDING' },
          include: { record: true }
        }
      }
    })

    if (schedules.length === 0) {
      console.log('📋 No schedules due for execution')
      return { totalSent: 0, totalFailed: 0 }
    }

    console.log(`📋 Found ${schedules.length} schedules due for execution`)

    let totalSent = 0
    let totalFailed = 0

    for (const schedule of schedules) {
      console.log(`  📋 Processing schedule: "${schedule.name}" (${schedule.records.length} records)`)
      
      if (schedule.records.length === 0) {
        console.log(`  ⚠️ Schedule "${schedule.name}" has no pending records, skipping`)
        continue
      }

      const recordIds = schedule.records.map(r => r.recordId)
      
      try {
        const result = await sendBulkReminders({
          recordIds,
          userId: schedule.createdBy,
          userRole: 'ADMIN',
          ipAddress: 'scheduler'
        })

        totalSent += result.sent
        totalFailed += result.failed

        console.log(`  ✅ Schedule "${schedule.name}" completed: ${result.sent} sent, ${result.failed} failed`)

        // Update schedule last run and next run
        const nextRunAt = calculateNextRun(schedule)
        
        await prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: nextRunAt,
          }
        })

        // Update record statuses in schedule
        for (const record of schedule.records) {
          await prisma.reminderScheduleRecord.update({
            where: { id: record.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          })
        }

        await createAuditLog({
          action: 'REMINDER_SCHEDULE_RUN',
          userId: schedule.createdBy,
          userRole: 'ADMIN',
          entityType: 'REMINDER_SCHEDULE',
          entityId: schedule.id,
          description: `Scheduled reminder "${schedule.name}" sent: ${result.sent} sent, ${result.failed} failed`,
          metadata: { 
            scheduleId: schedule.id, 
            sent: result.sent, 
            failed: result.failed,
            total: result.total
          },
          ipAddress: 'scheduler'
        })

      } catch (error) {
        console.error(`  ❌ Schedule "${schedule.name}" failed:`, error.message)
        totalFailed += schedule.records.length
      }

      // Add small delay between schedules to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`✅ Scheduled reminders completed: ${totalSent} sent, ${totalFailed} failed`)
    return { totalSent, totalFailed }

  } catch (error) {
    console.error('❌ Scheduled reminder task failed:', error)
    throw error
  }
}

// ─────────────────────────────────────────────
// Calculate Next Run Time
// ─────────────────────────────────────────────
const calculateNextRun = (schedule) => {
  const now = new Date()
  const next = new Date(now)
  
  switch (schedule.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      break
    case 'CUSTOM':
      next.setDate(next.getDate() + 1)
      break
    default:
      next.setDate(next.getDate() + 1)
  }
  
  return next
}

// ─────────────────────────────────────────────
// Health Check - Find Overdue Schedules
// ─────────────────────────────────────────────
const checkOverdueSchedules = async () => {
  try {
    const overdue = await prisma.reminderSchedule.count({
      where: {
        isActive: true,
        nextRunAt: { lte: new Date() }
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

  // Main reminder task
  const mainJob = cron.schedule(SCHEDULER_CONFIG.DEFAULT_SCHEDULE, async () => {
    try {
      await sendScheduledReminders()
    } catch (error) {
      console.error('Cron job failed:', error)
    }
  })

  // Health check task
  const healthJob = cron.schedule(SCHEDULER_CONFIG.HEALTH_CHECK, async () => {
    await checkOverdueSchedules()
  })

  console.log('✅ Scheduler initialized')
  console.log(`  📅 Main task: ${SCHEDULER_CONFIG.DEFAULT_SCHEDULE}`)
  console.log(`  🔍 Health check: ${SCHEDULER_CONFIG.HEALTH_CHECK}`)

  // Return jobs for potential cleanup
  return { mainJob, healthJob }
}

// ─────────────────────────────────────────────
// Stop Scheduler (for graceful shutdown)
// ─────────────────────────────────────────────
export const stopScheduler = (jobs) => {
  if (jobs) {
    jobs.mainJob.stop()
    jobs.healthJob.stop()
    console.log('⏰ Scheduler stopped')
  }
}