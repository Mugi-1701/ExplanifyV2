-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectRole_new" AS ENUM ('LEAD', 'MEMBER', 'VIEWER');

-- Preserve existing data while moving Membership to the new organization role enum.
ALTER TABLE "Membership"
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE "OrganizationRole" USING ("role"::text::"OrganizationRole"),
ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- Preserve existing project member assignments by mapping removed OWNER to LEAD.
ALTER TABLE "ProjectMember"
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "role" TYPE "ProjectRole_new" USING (
  CASE
    WHEN "role"::text = 'OWNER' THEN 'LEAD'
    ELSE "role"::text
  END::"ProjectRole_new"
),
ALTER COLUMN "role" SET DEFAULT 'MEMBER';

ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
