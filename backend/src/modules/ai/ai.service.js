const { AppError } = require("../../utils/AppError");
const { prisma } = require("../../lib/prisma");

function getMemberSkills(member) {
  const skillNames = Array.isArray(member.memberSkills) && member.memberSkills.length > 0
    ? member.memberSkills.map((entry) => entry.skill?.name).filter(Boolean)
    : Array.isArray(member.skills)
      ? member.skills
      : [];

  return [...new Set(skillNames)];
}

function getActiveTaskCount(projectTasks, memberUserId) {
  return projectTasks.filter((task) => task.assigneeId === memberUserId && task.status !== "DONE" && task.status !== "CANCELED").length;
}

function getMemberCalendarHours(calendarEvents, memberUserId) {
  return calendarEvents
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

function normalizeSkill(skill) {
  return String(skill ?? "").trim().toLowerCase();
}

function normalizeSkillList(skills) {
  return (Array.isArray(skills) ? skills : []).map(normalizeSkill).filter(Boolean);
}

function calculateSkillScore(memberSkills, requiredSkills) {
  if (!requiredSkills.length) {
    return { score: 1, matchedSkills: [] };
  }

  const normalizedMemberSkills = normalizeSkillList(memberSkills);
  const normalizedRequiredSkills = normalizeSkillList(requiredSkills);
  const matchedSkills = normalizedRequiredSkills.filter((skill) => normalizedMemberSkills.includes(skill));
  return {
    score: matchedSkills.length / normalizedRequiredSkills.length,
    matchedSkills,
  };
}

function calculateWorkloadScore(activeTaskCount) {
  if (activeTaskCount <= 0) return 1;
  if (activeTaskCount === 1) return 0.8;
  if (activeTaskCount === 2) return 0.6;
  if (activeTaskCount === 3) return 0.4;
  return 0.2;
}

function calculateAvailabilityScore(calendarHours) {
  if (calendarHours <= 0) return 1;
  if (calendarHours <= 2) return 0.85;
  if (calendarHours <= 4) return 0.7;
  if (calendarHours <= 6) return 0.5;
  return 0.25;
}

function calculateConfidence(score, runnerUpScore) {
  const gap = score - runnerUpScore;
  if (score >= 0.85 || gap >= 0.2) return "HIGH";
  if (score >= 0.65 || gap >= 0.1) return "MEDIUM";
  return "LOW";
}

function calculateWorkloadStatus(utilization) {
  if (utilization <= 40) return "AVAILABLE";
  if (utilization <= 75) return "HEALTHY";
  if (utilization <= 90) return "BUSY";
  return "OVERLOADED";
}

function calculateMemberUtilization(activeTaskCount, calendarHours) {
  const taskLoad = activeTaskCount * 20;
  const calendarLoad = (calendarHours / 40) * 100;
  return Math.min(100, Math.round(taskLoad + calendarLoad));
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function extractRequiredSkills(task, workspaceSkills) {
  const haystack = normalizeText(`${task.title ?? ""} ${task.description ?? ""}`);
  return workspaceSkills
    .filter((skill) => haystack.includes(normalizeSkill(skill.name)))
    .map((skill) => skill.name);
}

function scoreRebalanceCandidate(candidateSkills, requiredSkills, utilization) {
  const normalizedCandidateSkills = normalizeSkillList(candidateSkills);
  const normalizedRequiredSkills = normalizeSkillList(requiredSkills);
  const matchedSkills = normalizedRequiredSkills.filter((skill) => normalizedCandidateSkills.includes(skill));
  const skillMatch = normalizedRequiredSkills.length > 0 ? matchedSkills.length / normalizedRequiredSkills.length : 0;
  const availabilityScore = (100 - utilization) / 100;
  return {
    matchedSkills,
    score: (skillMatch * 0.7) + (availabilityScore * 0.3),
  };
}

async function recommendAssignee({ projectId, userId, requiredSkills = [] }) {
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          memberSkills: {
            include: { skill: true },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          assigneeId: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId: project.orgId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }

  let members = Array.isArray(project.members) ? project.members : [];

  if (members.length === 0) {
    members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        memberSkills: {
          include: { skill: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        roleRef: true,
      },
    });
  }

  // Temporary debug trace for recommendation inputs and loaded members.
  // eslint-disable-next-line no-console
  console.log("PROJECT MEMBERS COUNT:", members.length);
  // eslint-disable-next-line no-console
  console.log("PROJECT MEMBERS:", members);
  // eslint-disable-next-line no-console
  console.log("REQUIRED SKILLS:", requiredSkills);
  // eslint-disable-next-line no-console
  console.log("[AI] Members found:", members.length);

  if (!Array.isArray(members) || members.length === 0) {
    console.warn("[AI] No project members found. Using fallback.");
    return {
      recommendedUserId: null,
      recommendedUserName: "No recommendation available",
      confidence: "LOW",
      score: 0,
      explanation: [
        "No project members were returned by the member lookup query.",
        "AI recommendation temporarily unavailable.",
      ],
    };
  }

  const memberUserIds = members.map((member) => member.userId);
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: { in: memberUserIds },
    },
    select: {
      id: true,
      userId: true,
      startTime: true,
      endTime: true,
    },
  });

  const ranked = members.map((member) => {
    const memberSkills = getMemberSkills(member);
    const activeTaskCount = getActiveTaskCount(project.tasks, member.userId);
    const calendarHours = getMemberCalendarHours(calendarEvents, member.userId);

    const { score: skillScore, matchedSkills } = calculateSkillScore(memberSkills, requiredSkills);
    const workloadScore = calculateWorkloadScore(activeTaskCount);
    const availabilityScore = calculateAvailabilityScore(calendarHours);
    const score = (skillScore * 0.5) + (workloadScore * 0.3) + (availabilityScore * 0.2);

    const reasons = [
      `Skill score ${skillScore.toFixed(2)} from ${matchedSkills.length}/${requiredSkills.length || 0} matched required skill(s).`,
      `Workload score ${workloadScore.toFixed(2)} from ${activeTaskCount} active task(s).`,
      `Availability score ${availabilityScore.toFixed(2)} from ${calendarHours.toFixed(1)} scheduled hour(s).`,
    ];

    return {
      member,
      score,
      skillScore,
      workloadScore,
      availabilityScore,
      activeTaskCount,
      calendarHours,
      matchedSkills,
      reasons,
    };
  }).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.member.userId.localeCompare(right.member.userId);
  });

  const best = ranked[0];
  const runnerUp = ranked[1];

  return {
    recommendedMember: {
      id: best.member.userId,
      name: best.member.user?.name ?? "Unknown member",
      email: best.member.user?.email ?? "",
      avatarUrl: best.member.user?.avatarUrl ?? null,
      role: best.member.roleRef?.name ?? best.member.role ?? "Member",
    },
    confidence: calculateConfidence(best.score, runnerUp?.score ?? 0),
    score: Number(best.score.toFixed(3)),
    reasons: [
      `Recommended ${best.member.user?.name ?? "this member"} because they scored highest among ${ranked.length} project member(s).`,
      ...best.reasons,
      `Required skills evaluated: ${requiredSkills.length > 0 ? requiredSkills.join(", ") : "none"}.`,
    ],
  };
}

async function getProjectWorkload({ projectId, userId }) {
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId: project.orgId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }

  if (!Array.isArray(project.members) || project.members.length === 0) {
    return [];
  }

  const memberUserIds = project.members.map((member) => member.userId);
  const [projectTasks, calendarEvents] = await Promise.all([
    prisma.task.findMany({
      where: {
        projectId,
      },
      select: {
        assigneeId: true,
        status: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        userId: { in: memberUserIds },
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  return project.members.map((member) => {
    const activeTasks = projectTasks.filter(
      (task) => task.assigneeId === member.userId && task.status !== "DONE" && task.status !== "CANCELED"
    ).length;

    const calendarHours = calendarEvents
      .filter((event) => event.userId === member.userId)
      .reduce((sum, event) => {
        const start = new Date(event.startTime).getTime();
        const end = new Date(event.endTime).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
          return sum;
        }
        return sum + (end - start) / 3_600_000;
      }, 0);

    const utilization = calculateMemberUtilization(activeTasks, calendarHours);

    return {
      memberId: member.userId,
      memberName: member.user?.name ?? "Unknown member",
      activeTasks,
      calendarHours: Number(calendarHours.toFixed(2)),
      utilization,
      status: calculateWorkloadStatus(utilization),
    };
  });
}

async function getRebalancingSuggestions({ projectId, userId }) {
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          memberSkills: {
            include: { skill: true },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      organization: {
        include: {
          skills: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId: project.orgId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }

  if (!Array.isArray(project.members) || project.members.length === 0) {
    return { suggestions: [] };
  }

  // TEMP DEBUG: all project members loaded before any filtering.
  // eslint-disable-next-line no-console
  console.log("[ai.rebalance] ALL PROJECT MEMBERS", project.members.map((member) => ({
    memberId: member.userId,
    memberName: member.user?.name ?? "Unknown member",
    projectSkills: member.skills ?? [],
    memberSkills: getMemberSkills(member),
  })));

  const memberUserIds = project.members.map((member) => member.userId);
  const [projectTasks, calendarEvents] = await Promise.all([
    prisma.task.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assigneeId: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        userId: { in: memberUserIds },
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  const workloadByMemberId = new Map();
  for (const member of project.members) {
    const activeTasks = projectTasks.filter(
      (task) => task.assigneeId === member.userId && task.status !== "DONE" && task.status !== "CANCELED"
    ).length;

    const calendarHours = calendarEvents
      .filter((event) => event.userId === member.userId)
      .reduce((sum, event) => {
        const start = new Date(event.startTime).getTime();
        const end = new Date(event.endTime).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
          return sum;
        }
        return sum + (end - start) / 3_600_000;
      }, 0);

    const utilization = calculateMemberUtilization(activeTasks, calendarHours);
    workloadByMemberId.set(member.userId, {
      activeTasks,
      calendarHours: Number(calendarHours.toFixed(2)),
      utilization,
      status: calculateWorkloadStatus(utilization),
      skills: getMemberSkills(member),
      memberName: member.user?.name ?? "Unknown member",
    });
  }

  const overloadedMembers = project.members.filter((member) => (workloadByMemberId.get(member.userId)?.utilization ?? 0) > 75);
  const availableMembers = project.members.filter((member) => (workloadByMemberId.get(member.userId)?.utilization ?? 0) < 40);
  const workspaceSkills = project.organization?.skills ?? [];
  const suggestions = [];

  // TEMP DEBUG: runtime trace for rebalance filtering.
  // eslint-disable-next-line no-console
  console.log("[ai.rebalance] overloadedMembers", overloadedMembers.map((member) => ({
    memberId: member.userId,
    memberName: member.user?.name ?? "Unknown member",
    utilization: workloadByMemberId.get(member.userId)?.utilization ?? 0,
  })));
  // eslint-disable-next-line no-console
  console.log("[ai.rebalance] candidateMembers", availableMembers.map((member) => ({
    memberId: member.userId,
    memberName: member.user?.name ?? "Unknown member",
    utilization: workloadByMemberId.get(member.userId)?.utilization ?? 0,
    skills: getMemberSkills(member),
  })));

  for (const sourceMember of overloadedMembers) {
    const sourceWorkload = workloadByMemberId.get(sourceMember.userId);
    const sourceMemberTasks = projectTasks.filter(
      (task) => task.assigneeId === sourceMember.userId && (task.status === "TODO" || task.status === "IN_PROGRESS")
    );

    // eslint-disable-next-line no-console
    console.log("[ai.rebalance] tasks selected for rebalance", {
      sourceMemberId: sourceMember.userId,
      sourceMemberName: sourceMember.user?.name ?? "Unknown member",
      taskCount: sourceMemberTasks.length,
      tasks: sourceMemberTasks.map((task) => ({
        taskId: task.id,
        taskTitle: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
      })),
    });

    for (const task of sourceMemberTasks) {
      const requiredSkills = extractRequiredSkills(task, workspaceSkills);
      const normalizedTaskSkills = normalizeSkillList(requiredSkills);
      // eslint-disable-next-line no-console
      console.log("[ai.rebalance] Task skills", requiredSkills);
      // eslint-disable-next-line no-console
      console.log("[ai.rebalance] Normalized task skills", normalizedTaskSkills);
      // eslint-disable-next-line no-console
      console.log("[ai.rebalance] requiredSkills for each task", {
        taskId: task.id,
        taskTitle: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
        requiredSkills,
      });
      if (requiredSkills.length === 0) {
        // eslint-disable-next-line no-console
        console.log("[ai.rebalance] REJECTED TASK - no required skills detected", {
          taskId: task.id,
          taskTitle: task.title,
        });
        continue;
      }

      let bestCandidate = null;

      for (const targetMember of availableMembers) {
        if (targetMember.userId === task.assigneeId) {
          continue;
        }

        const targetWorkload = workloadByMemberId.get(targetMember.userId);
        const targetSkills = targetWorkload?.skills ?? [];
        const normalizedCandidateSkills = normalizeSkillList(targetSkills);
        const { matchedSkills, score } = scoreRebalanceCandidate(targetSkills, requiredSkills, targetWorkload?.utilization ?? 100);

        // eslint-disable-next-line no-console
        console.log("[ai.rebalance] Candidate skills", targetSkills);
        // eslint-disable-next-line no-console
        console.log("[ai.rebalance] Normalized candidate skills", normalizedCandidateSkills);
        // eslint-disable-next-line no-console
        console.log("[ai.rebalance] candidate skill matches", {
          taskId: task.id,
          taskTitle: task.title,
          candidateMemberId: targetMember.userId,
          candidateMemberName: targetMember.user?.name ?? "Unknown member",
          requiredSkills,
          candidateSkills: targetSkills,
          matchedSkills,
          candidateUtilization: targetWorkload?.utilization ?? 0,
          score,
        });

        if (matchedSkills.length === 0) {
          // eslint-disable-next-line no-console
          console.log("[ai.rebalance] REJECTED CANDIDATE - no normalized skill overlap", {
            taskId: task.id,
            candidateMemberId: targetMember.userId,
            candidateMemberName: targetMember.user?.name ?? "Unknown member",
            requiredSkills,
            candidateSkills: targetSkills,
            normalizedRequiredSkills: normalizedSkillList(requiredSkills),
            normalizedCandidateSkills,
          });
          continue;
        }

        if (!bestCandidate || score > bestCandidate.score || (score === bestCandidate.score && targetMember.userId.localeCompare(bestCandidate.toMemberId) < 0)) {
          bestCandidate = {
            taskId: task.id,
            taskTitle: task.title,
            fromMemberId: sourceMember.userId,
            fromMemberName: sourceMember.user?.name ?? sourceWorkload?.memberName ?? "Unknown member",
            toMemberId: targetMember.userId,
            toMemberName: targetMember.user?.name ?? targetWorkload?.memberName ?? "Unknown member",
            score,
            matchedSkills,
            sourceUtilization: sourceWorkload?.utilization ?? 0,
            targetUtilization: targetWorkload?.utilization ?? 0,
          };
        }
      }

      if (bestCandidate) {
        suggestions.push({
          taskId: bestCandidate.taskId,
          taskTitle: bestCandidate.taskTitle,
          fromMemberId: bestCandidate.fromMemberId,
          fromMemberName: bestCandidate.fromMemberName,
          toMemberId: bestCandidate.toMemberId,
          toMemberName: bestCandidate.toMemberName,
          reasons: [
            `Source member utilization is ${bestCandidate.sourceUtilization}%`,
            `Target member utilization is ${bestCandidate.targetUtilization}%`,
            `Required skills matched`,
          ],
        });
      } else {
        // eslint-disable-next-line no-console
        console.log("[ai.rebalance] REJECTED TASK - no candidate passed matching/availability filters", {
          taskId: task.id,
          taskTitle: task.title,
          requiredSkills,
        });
      }

      // eslint-disable-next-line no-console
      console.log("[ai.rebalance] bestCandidate", bestCandidate);
    }
  }

  // eslint-disable-next-line no-console
  console.log("[ai.rebalance] suggestions before return", suggestions);

  return { suggestions };
}

module.exports = {
  recommendAssignee,
  getProjectWorkload,
  getRebalancingSuggestions,
};
