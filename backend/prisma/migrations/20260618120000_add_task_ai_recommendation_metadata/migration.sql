ALTER TABLE "Task"
ADD COLUMN "aiRecommendedUserId" TEXT,
ADD COLUMN "aiRecommendationScore" DOUBLE PRECISION,
ADD COLUMN "aiRecommendationConfidence" "AIConfidence",
ADD COLUMN "aiRecommendationExplanation" JSONB;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_aiRecommendedUserId_fkey"
FOREIGN KEY ("aiRecommendedUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
