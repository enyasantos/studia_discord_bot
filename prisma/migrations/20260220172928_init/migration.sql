-- AlterTable
ALTER TABLE "PomodoroSession" ADD COLUMN     "context" JSONB,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "stateValue" JSONB;
