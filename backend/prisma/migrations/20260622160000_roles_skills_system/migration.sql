ALTER TABLE "ProjectMember"
ADD COLUMN IF NOT EXISTS "roleId" TEXT;

CREATE TABLE IF NOT EXISTS "WorkspaceRole" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkspaceSkill" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MemberSkill" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberSkill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceRole_workspaceId_name_key" ON "WorkspaceRole"("workspaceId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceSkill_workspaceId_name_key" ON "WorkspaceSkill"("workspaceId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "MemberSkill_memberId_skillId_key" ON "MemberSkill"("memberId", "skillId");
CREATE INDEX IF NOT EXISTS "WorkspaceRole_workspaceId_idx" ON "WorkspaceRole"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceSkill_workspaceId_idx" ON "WorkspaceSkill"("workspaceId");
CREATE INDEX IF NOT EXISTS "MemberSkill_skillId_idx" ON "MemberSkill"("skillId");
CREATE INDEX IF NOT EXISTS "ProjectMember_roleId_idx" ON "ProjectMember"("roleId");

ALTER TABLE "ProjectMember"
ADD CONSTRAINT "ProjectMember_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkspaceRole"
ADD CONSTRAINT "WorkspaceRole_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceSkill"
ADD CONSTRAINT "WorkspaceSkill_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberSkill"
ADD CONSTRAINT "MemberSkill_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberSkill"
ADD CONSTRAINT "MemberSkill_skillId_fkey"
FOREIGN KEY ("skillId") REFERENCES "WorkspaceSkill"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
