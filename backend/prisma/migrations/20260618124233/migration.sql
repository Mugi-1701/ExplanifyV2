/*
  Warnings:

  - You are about to drop the column `actorId` on the `EventLog` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `EventLog` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `EventLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EventLog"
DROP COLUMN IF EXISTS "actorId",
DROP COLUMN IF EXISTS "orgId",
DROP COLUMN IF EXISTS "payload";
