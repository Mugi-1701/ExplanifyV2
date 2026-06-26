const { AppError } = require("../../../utils/AppError");
const { prisma } = require("../../../lib/prisma");
const { getProjectWorkloadData } = require("./workload.repository");

function normalizeSkill(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatSkillList(member) {
  const memberSkills = Array.isArray(member.memberSkills)
    ? member.memberSkills
        .map((entry) => entry?.skill?.name ?? entry?.name ?? null)
        .filter((skill) => typeof skill === "string" && skill.trim())
    : [];
  const directSkills = Array.isArray(member.skills) ? member.skills : [];
  return [...new Set([...memberSkills, ...directSkills].map(normalizeSkill).filter(Boolean))];
}

function getMemberTaskBuckets(tasks, memberUserId) {
  const memberTasks = tasks.filter((task) => task.assigneeId === memberUserId);
  const activeTasks = memberTasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELED");
  const inProgressTasks = memberTasks.filter((task) => task.status === "IN_PROGRESS");
  const pendingTasks = memberTasks.filter((task) => task.status === "TODO" || task.status === "IN_REVIEW" || task.status === "BLOCKED");
  const completedTasks = memberTasks.filter((task) => task.status === "DONE");

  return {
    activeTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
  };
}

function calculateWorkloadScore({ activeTasks, inProgressTasks, pendingTasks }) {
  return (activeTasks * 2) + (inProgressTasks * 3) + pendingTasks;
}

function calculateWorkloadStatus(utilization) {
  if (utilization <= 40) return "AVAILABLE";
  if (utilization <= 75) return "HEALTHY";
  if (utilization <= 90) return "BUSY";
  return "OVERLOADED";
}

function calculateMemberUtilization(workload) {
  if (workload <= 0) return 0;
  if (workload <= 2) return 25;
  if (workload <= 4) return 45;
  if (workload <= 6) return 65;
  if (workload <= 8) return 80;
  return Math.min(100, 70 + ((workload - 8) * 4));
}

function getMemberCalendarHours(calendarEvents, memberUserId) {
  return (Array.isArray(calendarEvents) ? calendarEvents : [])
    .filter((event) => event.userId === memberUserId)
    .reduce((sum, event) => {
      const start = new Date(event.startTime).getTime();
      const end = new Date(event.endTime).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        return sum;
      }
      return sum + (end - start) / 3_600_000;
    }, 0);
}

async function getProjectCalendarEvents(memberUserIds) {
  if (!Array.isArray(memberUserIds) || memberUserIds.length === 0) {
    return [];
  }

  try {
    return await prisma.calendarEvent.findMany({
      where: {
        userId: { in: memberUserIds },
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
      },
    });
  } catch (error) {
    // Optional module or missing relation support should not block workload analysis.
    return [];
  }
}

function isTaskEligible(task) {
  return task.status !== "DONE" && task.status !== "BLOCKED";
}

function hasSkillMatch(task, targetSkills) {
  const requiredSkills = Array.isArray(task.requiredSkills) ? task.requiredSkills : [];
  if (requiredSkills.length === 0) {
    return true;
  }

  const normalizedTargetSkills = new Set(targetSkills.map(normalizeSkill));
  return requiredSkills.some((skill) => normalizedTargetSkills.has(normalizeSkill(skill)));
}

function calculatePriority({ sourceUtilization, targetUtilization, requiredSkillsMatched, requiredSkillsTotal, taskStatus }) {
  const skillCoverage = requiredSkillsTotal > 0 ? requiredSkillsMatched / requiredSkillsTotal : 0;
  const utilizationGap = sourceUtilization - targetUtilization;
  const sourceIsOverloaded = sourceUtilization > 95;
  const sourceIsBusy = sourceUtilization >= 80;
  const strongImprovement = utilizationGap >= 20 || targetUtilization <= 40;
  const taskIsBlocking = taskStatus === "BLOCKED" || taskStatus === "IN_PROGRESS";

  if ((sourceIsOverloaded && strongImprovement) || (sourceIsOverloaded && taskIsBlocking && skillCoverage >= 0.75)) {
    return "HIGH";
  }

  if (sourceIsBusy && (utilizationGap >= 10 || skillCoverage >= 0.5)) {
    return "MEDIUM";
  }

  return "LOW";
}

function calculateConfidence({ sourceSkillsMatched, requiredSkillsTotal, targetUtilization, sourceUtilization, utilizationGap }) {
  const skillCoverage = requiredSkillsTotal > 0 ? sourceSkillsMatched / requiredSkillsTotal : 0;
  const balanceImprovement = utilizationGap >= 15 || targetUtilization <= 45;

  if (skillCoverage >= 0.85 && targetUtilization <= 40 && balanceImprovement) {
    return "HIGH";
  }

  if (skillCoverage >= 0.5 && (balanceImprovement || sourceUtilization >= 80)) {
    return "MEDIUM";
  }

  return "LOW";
}

async function analyzeProjectWorkload(projectId, userId) {
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const project = await getProjectWorkloadData(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const membersOnProject = Array.isArray(project.members) ? project.members : [];
  const memberLookup = new Map(membersOnProject.map((member) => [member.userId, member]));
  if (membersOnProject.length === 0) {
    return {
      status: "BALANCED",
      projectHealth: 100,
      members: [],
      recommendations: [],
    };
  }

  const calendarEvents = await getProjectCalendarEvents(membersOnProject.map((member) => member.userId));

  const members = membersOnProject.map((member) => {
    const buckets = getMemberTaskBuckets(project.tasks ?? [], member.userId);
    const skills = formatSkillList(member);
    const workload = calculateWorkloadScore({
      activeTasks: buckets.activeTasks.length,
      inProgressTasks: buckets.inProgressTasks.length,
      pendingTasks: buckets.pendingTasks.length,
    });
    const calendarHours = Number(getMemberCalendarHours(calendarEvents, member.userId).toFixed(2));
    const utilization = calculateMemberUtilization(workload + Math.ceil(calendarHours / 2));

    return {
      memberId: member.userId,
      name: member.user?.name ?? "Unknown member",
      skills,
      activeTasks: buckets.activeTasks.length,
      inProgressTasks: buckets.inProgressTasks.length,
      pendingTasks: buckets.pendingTasks.length,
      completedTasks: buckets.completedTasks.length,
      workload,
      calendarHours,
      utilization,
      status: calculateWorkloadStatus(utilization),
      tasks: buckets.activeTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        requiredSkills: Array.isArray(task.requiredSkills) ? task.requiredSkills : [],
      })),
    };
  });

  const highestWorkload = Math.max(...members.map((member) => member.workload), 0);
  const lowestWorkload = Math.min(...members.map((member) => member.workload));
  const status = members.length > 1 && highestWorkload > lowestWorkload * 2 ? "IMBALANCED" : "BALANCED";

  const overloadedMember = [...members].sort((left, right) => right.workload - left.workload)[0] ?? null;
  const underloadedMember = [...members].sort((left, right) => left.workload - right.workload)[0] ?? null;
  const recommendations = [];

  if (overloadedMember && underloadedMember && overloadedMember.memberId !== underloadedMember.memberId) {
    const sourceMember = memberLookup.get(overloadedMember.memberId);
    const targetMember = memberLookup.get(underloadedMember.memberId);
    const sourceTasks = project.tasks
      .filter((task) => task.assigneeId === overloadedMember.memberId)
      .filter(isTaskEligible)
      .filter((task) => hasSkillMatch(task, underloadedMember.skills));

    for (const task of sourceTasks.slice(0, 3)) {
      const requiredSkills = Array.isArray(task.requiredSkills) ? task.requiredSkills : [];
      const matchedSkills = requiredSkills.filter((skill) => underloadedMember.skills.some((targetSkill) => normalizeSkill(targetSkill) === normalizeSkill(skill)));
      const sourceUtilization = overloadedMember.utilization;
      const targetUtilization = underloadedMember.utilization;
      const utilizationGap = sourceUtilization - targetUtilization;
      const priority = calculatePriority({
        sourceUtilization,
        targetUtilization,
        requiredSkillsMatched: matchedSkills.length,
        requiredSkillsTotal: requiredSkills.length,
        taskStatus: task.status,
      });
      const confidence = calculateConfidence({
        sourceSkillsMatched: matchedSkills.length,
        requiredSkillsTotal: requiredSkills.length,
        targetUtilization,
        sourceUtilization,
        utilizationGap,
      });

      recommendations.push({
        taskId: task.id,
        taskTitle: task.title,
        from: sourceMember?.user?.name ?? overloadedMember.name,
        to: targetMember?.user?.name ?? underloadedMember.name,
        priority,
        confidence,
        reason: [
          `${targetMember?.user?.name ?? underloadedMember.name} has required skills`,
          `Current workload is lower (${targetUtilization}%)`,
          `Reassignment improves balance by ${Math.max(0, Math.round(utilizationGap))}%`,
        ],
      });
    }
  }

  const projectHealth = Math.max(0, Math.min(100, Math.round(100 - (highestWorkload * 3))));

  // eslint-disable-next-line no-console
  console.log("[ai.workload] analysis", {
    projectId,
    totalMembers: members.length,
    highestWorkload,
    lowestWorkload,
    status,
    projectHealth,
    recommendations: recommendations.length,
  });

  return {
    status,
    projectHealth,
    members: members.map((member) => ({
      memberId: member.memberId,
      name: member.name,
      workload: member.workload,
      activeTasks: member.activeTasks,
      inProgressTasks: member.inProgressTasks,
      pendingTasks: member.pendingTasks,
      completedTasks: member.completedTasks,
      calendarHours: member.calendarHours,
      utilization: member.utilization,
      status: member.status,
    })),
    recommendations,
  };
}

module.exports = { analyzeProjectWorkload, calculateWorkloadScore };
