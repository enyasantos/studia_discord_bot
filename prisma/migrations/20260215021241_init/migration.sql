/*
  Warnings:

  - You are about to drop the column `focusOverlapTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `pomodoroActiveTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `voiceActiveTime` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "focusOverlapTime",
DROP COLUMN "pomodoroActiveTime",
DROP COLUMN "voiceActiveTime";
