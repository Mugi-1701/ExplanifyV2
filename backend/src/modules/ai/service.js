const { AppError } = require("../../utils/AppError");
const { getMembership } = require("../organizations/organization.repository");
const { getProjectRecommendationContext } = require("./repository");

const ROLE_BONUS = {
  "Tech Lead": 10,
  Owner: 15,
  Admin: 8,
  Member: 0,
  Viewer: -5,
};

const WORKLOAD_BONUS = {
  0: 30,
  1: 20,
  2: 10,
};

function getWorkloadScore(assignedTaskCount) {
  if (assignedTaskCount >= 3) {
    return 0;
  }

  return WORKLOAD_BONUS[assignedTaskCount] ?? 0;
}

function calculateMemberRecommendation(member, tasks, requiredSkills = []) {
  const memberSkills = Array.isArray(member.memberSkills) && member.memberSkills.length > 0
    ? member.memberSkills.map((entry) => entry.skill?.name).filter(Boolean)
    : Array.isArray(member.skills)
      ? member.skills
      : [];
  const assignedTasks = tasks.filter((task) => task.assigneeId === member.userId);

  const matchingSkills = requiredSkills.filter((skill) => memberSkills.includes(skill));
  const skillMatchScore = matchingSkills.length * 50;
  const workloadScore = getWorkloadScore(assignedTasks.length);
  const role = member.role ?? "Member";
  const roleBonus = ROLE_BONUS[role] ?? 0;
  const score = skillMatchScore + workloadScore + roleBonus;

  const explanation = [
    `Matched ${matchingSkills.length} required skill${matchingSkills.length === 1 ? "" : "s"}: ${matchingSkills.length > 0 ? matchingSkills.join(", ") : "none"}.`,
    `Assigned workload is ${assignedTasks.length}, giving a workload score of ${workloadScore}.`,
    `Role bonus for ${role} is ${roleBonus}.`,
  ];

  return {
    member,
    score,
    explanation,
    matchingSkills,
    assignedTaskCount: assignedTasks.length,
  };
}

function calculateConfidence(score, runnerUpScore) {
  if (score <= 0) {
    return "low";
  }

  const gap = score - runnerUpScore;
  if (score >= 100 || gap >= 40) {
    return "high";
  }

  if (score >= 60 || gap >= 20) {
    return "medium";
  }

  return "low";
}

async function recommendAssignee({ projectId, userId, requiredSkills = [] }) {
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const project = await getProjectRecommendationContext(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const membership = await getMembership({ orgId: project.orgId, userId });
  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }

  if (!project.members.length) {
    throw new AppError("Project has no members to recommend from", 400);
  }

  const ranked = project.members
    .map((member) => calculateMemberRecommendation(member, project.tasks, requiredSkills))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.member.userId.localeCompare(b.member.userId);
    });

  const best = ranked[0];
  const runnerUp = ranked[1];

  return {
    recommendedUserId: best.member.userId,
    recommendedName: best.member.user?.name ?? "Unknown member",
    score: best.score,
    confidence: calculateConfidence(best.score, runnerUp?.score ?? 0),
    explanation: [
      `Recommended because ${best.member.user?.name ?? "this member"} scored highest among ${ranked.length} project members.`,
      ...best.explanation,
      `Required skills evaluated: ${requiredSkills.length > 0 ? requiredSkills.join(", ") : "none"}.`,
    ],
  };
}

module.exports = {
  recommendAssignee,
  calculateMemberRecommendation,
  calculateConfidence,
  getWorkloadScore,
};
