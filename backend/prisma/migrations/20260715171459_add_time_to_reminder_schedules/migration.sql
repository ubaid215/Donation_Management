/*
  Warnings:

  - Added the required column `updatedAt` to the `reminder_schedule_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reminder_schedule_records" DROP CONSTRAINT "reminder_schedule_records_scheduleId_fkey";

-- DropIndex
DROP INDEX "reminder_schedule_records_scheduleId_recordId_key";

-- AlterTable
ALTER TABLE "reminder_schedule_records" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "reminder_schedules" ADD COLUMN     "time" TEXT DEFAULT '09:00';

-- CreateIndex
CREATE INDEX "reminder_schedule_records_scheduleId_idx" ON "reminder_schedule_records"("scheduleId");

-- CreateIndex
CREATE INDEX "reminder_schedule_records_recordId_idx" ON "reminder_schedule_records"("recordId");

-- AddForeignKey
ALTER TABLE "reminder_schedule_records" ADD CONSTRAINT "reminder_schedule_records_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "reminder_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
