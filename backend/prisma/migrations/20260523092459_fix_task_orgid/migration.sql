/*
  Warnings:

  - You are about to drop the column `fromTaskId` on the `TaskDependency` table. All the data in the column will be lost.
  - You are about to drop the column `toTaskId` on the `TaskDependency` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `TaskDependency` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[taskId,dependsOnTaskId]` on the table `TaskDependency` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dependsOnTaskId` to the `TaskDependency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `TaskDependency` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskDependency" DROP CONSTRAINT "TaskDependency_fromTaskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskDependency" DROP CONSTRAINT "TaskDependency_toTaskId_fkey";

-- DropIndex
DROP INDEX "TaskDependency_fromTaskId_toTaskId_key";

-- DropIndex
DROP INDEX "TaskDependency_toTaskId_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TaskDependency" DROP COLUMN "fromTaskId",
DROP COLUMN "toTaskId",
DROP COLUMN "type",
ADD COLUMN     "dependsOnTaskId" TEXT NOT NULL,
ADD COLUMN     "taskId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Task_organizationId_projectId_idx" ON "Task"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnTaskId_idx" ON "TaskDependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnTaskId_key" ON "TaskDependency"("taskId", "dependsOnTaskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
