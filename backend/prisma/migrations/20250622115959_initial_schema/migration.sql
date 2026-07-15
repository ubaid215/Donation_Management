-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('DONATION_CREATED', 'DONATION_EMAIL_SENT', 'EMAIL_SENT', 'EMAIL_RESENT', 'EMAIL_FAILED', 'WHATSAPP_SENT', 'WHATSAPP_DELIVERED', 'WHATSAPP_READ', 'WHATSAPP_FAILED', 'WHATSAPP_PENDING', 'DONATION_UPDATED', 'DONATION_DELETED', 'DONATION_RESTORED', 'WHATSAPP_SKIPPED', 'OPERATOR_LOGIN', 'ADMIN_LOGIN', 'EMAIL_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PDF_EXPORTED', 'KHIDMAT_CREATED', 'KHIDMAT_UPDATED', 'KHIDMAT_DELETED', 'KHIDMAT_RESTORED', 'KHIDMAT_WHATSAPP_SENT', 'KHIDMAT_WHATSAPP_FAILED', 'KHIDMAT_WHATSAPP_SKIPPED', 'KHIDMAT_PAYMENT_ADDED', 'KHIDMAT_BULK_REMINDER_SENT', 'KHIDMAT_PERSON_WHATSAPP_SENT', 'REMINDER_SCHEDULE_CREATED', 'REMINDER_SCHEDULE_UPDATED', 'REMINDER_SCHEDULE_DELETED', 'REMINDER_SCHEDULE_RUN');

-- CreateEnum
CREATE TYPE "KhidmatStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'RECORD_ONLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'Tag',
    "color" TEXT DEFAULT '#3b82f6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "donorPhone" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "receiptNumber" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "whatsappMessageId" TEXT,
    "whatsappError" TEXT,
    "whatsappStatus" TEXT DEFAULT 'PENDING',
    "whatsappStatusUpdatedAt" TIMESTAMP(3),
    "whatsappDeliveryDetails" JSONB,
    "whatsappReadAt" TIMESTAMP(3),
    "templateUsed" TEXT,
    "templateType" TEXT,
    "operatorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "deletedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khidmat_payments" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "khidmat_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khidmat_records" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameUrdu" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "receivedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "status" "KhidmatStatus" NOT NULL DEFAULT 'RECORD_ONLY',
    "notes" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "whatsappMessageId" TEXT,
    "whatsappError" TEXT,
    "whatsappStatus" TEXT DEFAULT 'PENDING',
    "whatsappStatusUpdatedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "operatorId" TEXT NOT NULL,
    "deletedBy" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "khidmat_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_schedule_records" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_schedule_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL DEFAULT 'DAILY',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "filterStatuses" "KhidmatStatus"[] DEFAULT ARRAY['PARTIAL', 'RECORD_ONLY']::"KhidmatStatus"[],
    "filterCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiry" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "donation_categories_name_key" ON "donation_categories"("name" ASC);

-- CreateIndex
CREATE INDEX "donations_categoryId_idx" ON "donations"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "donations_deletedBy_idx" ON "donations"("deletedBy" ASC);

-- CreateIndex
CREATE INDEX "donations_operatorId_idx" ON "donations"("operatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "donations_whatsappMessageId_key" ON "donations"("whatsappMessageId" ASC);

-- CreateIndex
CREATE INDEX "khidmat_payments_paidAt_idx" ON "khidmat_payments"("paidAt" ASC);

-- CreateIndex
CREATE INDEX "khidmat_payments_recordId_idx" ON "khidmat_payments"("recordId" ASC);

-- CreateIndex
CREATE INDEX "khidmat_records_categoryId_idx" ON "khidmat_records"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "khidmat_records_deletedBy_idx" ON "khidmat_records"("deletedBy" ASC);

-- CreateIndex
CREATE INDEX "khidmat_records_operatorId_idx" ON "khidmat_records"("operatorId" ASC);

-- CreateIndex
CREATE INDEX "khidmat_records_phone_idx" ON "khidmat_records"("phone" ASC);

-- CreateIndex
CREATE INDEX "khidmat_records_status_idx" ON "khidmat_records"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "khidmat_records_whatsappMessageId_key" ON "khidmat_records"("whatsappMessageId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "reminder_schedule_records_scheduleId_recordId_key" ON "reminder_schedule_records"("scheduleId" ASC, "recordId" ASC);

-- CreateIndex
CREATE INDEX "reminder_schedule_records_status_idx" ON "reminder_schedule_records"("status" ASC);

-- CreateIndex
CREATE INDEX "reminder_schedules_isActive_idx" ON "reminder_schedules"("isActive" ASC);

-- CreateIndex
CREATE INDEX "reminder_schedules_nextRunAt_idx" ON "reminder_schedules"("nextRunAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken" ASC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "donation_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khidmat_payments" ADD CONSTRAINT "khidmat_payments_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "khidmat_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khidmat_records" ADD CONSTRAINT "khidmat_records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khidmat_records" ADD CONSTRAINT "khidmat_records_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khidmat_records" ADD CONSTRAINT "khidmat_records_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_schedule_records" ADD CONSTRAINT "reminder_schedule_records_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "khidmat_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_schedule_records" ADD CONSTRAINT "reminder_schedule_records_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "reminder_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

