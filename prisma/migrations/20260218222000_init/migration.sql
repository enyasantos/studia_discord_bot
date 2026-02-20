-- AlterTable
ALTER TABLE "PomodoroSession" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "PomodoroSession_status_idx" ON "PomodoroSession"("status");

-- CreateIndex
CREATE INDEX "PomodoroSession_endTime_idx" ON "PomodoroSession"("endTime");
