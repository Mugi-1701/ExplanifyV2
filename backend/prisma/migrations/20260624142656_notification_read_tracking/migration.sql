/*
  Warnings:

  - A unique constraint covering the columns `[eventLogId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_LOG';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "eventLogId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventLogId_key" ON "Notification"("eventLogId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventLogId_fkey" FOREIGN KEY ("eventLogId") REFERENCES "EventLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
