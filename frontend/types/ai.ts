export type AIRecommendationData = {
  recommendedUserId: string;
  recommendedName: string;
  score: number;
  confidence: "low" | "medium" | "high";
  explanation: string[];
};

export type AIRecommendationResponse = {
  data: AIRecommendationData;
};

export type AIRecommendationPayload = {
  aiRecommendedUserId?: string | null;
  aiRecommendationScore?: number | null;
  aiRecommendationConfidence?: "LOW" | "MEDIUM" | "HIGH" | null;
  aiRecommendationExplanation?: string[] | null;
};
