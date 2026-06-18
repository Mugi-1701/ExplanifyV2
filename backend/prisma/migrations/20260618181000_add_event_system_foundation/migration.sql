-- CreateEnum
CREATE TYPE "EventType" AS ENUM (
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_COMPLETED',
  'TASK_ASSIGNED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'DEPENDENCY_CREATED',
  'DEPENDENCY_REMOVED'
);

-- AlterTable
ALTER TABLE "EventLog"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "projectId" TEXT,
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "metadata" JSONB;

UPDATE "EventLog"
SET "eventType" = CASE "eventType"
  WHEN 'TaskCreated' THEN 'TASK_CREATED'
  WHEN 'TaskUpdated' THEN 'TASK_UPDATED'
  WHEN 'DependencyAdded' THEN 'DEPENDENCY_CREATED'
  WHEN 'BlockerDetected' THEN 'TASK_UPDATED'
  WHEN 'RiskScoreUpdated' THEN 'TASK_UPDATED'
  ELSE 'TASK_UPDATED'
END;

ALTER TABLE "EventLog"
  ALTER COLUMN "organizationId" SET NOT NULL,
  ALTER COLUMN "metadata" SET NOT NULL,
  ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb,
  ALTER COLUMN "eventType" TYPE "EventType" USING "eventType"::"EventType";

-- DropIndex
DROP INDEX IF EXISTS "EventLog_orgId_createdAt_idx";

-- DropConstraint
ALTER TABLE "EventLog" DROP CONSTRAINT IF EXISTS "EventLog_orgId_fkey";
ALTER TABLE "EventLog" DROP CONSTRAINT IF EXISTS "EventLog_actorId_fkey";

-- AddForeignKey
ALTER TABLE "EventLog"
  ADD CONSTRAINT "EventLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventLog"
  ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventLog"
  ADD CONSTRAINT "EventLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EventLog_organizationId_createdAt_idx" ON "EventLog"("organizationId", "createdAt");
CREATE INDEX "EventLog_projectId_createdAt_idx" ON "EventLog"("projectId", "createdAt");
CREATE INDEX IF NOT EXISTS "EventLog_entityType_entityId_idx" ON "EventLog"("entityType", "entityId");
