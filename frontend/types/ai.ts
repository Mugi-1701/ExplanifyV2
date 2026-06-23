export type AIWorkloadMember = {
  memberId: string;
  memberName: string;
  activeTasks: number;
  calendarHours: number;
  utilization: number;
  status: "AVAILABLE" | "HEALTHY" | "BUSY" | "OVERLOADED";
};

export type AIWorkloadResponse = {
  data: AIWorkloadMember[];
};
