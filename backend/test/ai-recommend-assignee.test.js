const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateMemberRecommendation,
  calculateConfidence,
  getWorkloadScore,
} = require("../src/modules/ai/service");

test("workload score follows the 0/1/2/3+ bonus rules", () => {
  assert.equal(getWorkloadScore(0), 30);
  assert.equal(getWorkloadScore(1), 20);
  assert.equal(getWorkloadScore(2), 10);
  assert.equal(getWorkloadScore(3), 0);
  assert.equal(getWorkloadScore(8), 0);
});

test("member recommendation score combines skills, workload, and role bonus deterministically", () => {
  const member = {
    userId: "user-1",
    role: "LEAD",
    skills: ["Frontend", "UI/UX"],
    user: { name: "Mugi" },
  };

  const tasks = [
    { assigneeId: "user-1", status: "TODO" },
    { assigneeId: "user-1", status: "DONE" },
    { assigneeId: "user-2", status: "IN_PROGRESS" },
  ];

  const result = calculateMemberRecommendation(member, tasks, ["Frontend", "UI/UX"]);

  assert.equal(result.score, 50 * 2 + 10 + 10);
  assert.deepEqual(result.matchingSkills, ["Frontend", "UI/UX"]);
  assert.equal(result.assignedTaskCount, 2);
});

test("confidence rises when the winner has a strong lead", () => {
  assert.equal(calculateConfidence(120, 60), "high");
  assert.equal(calculateConfidence(70, 55), "medium");
  assert.equal(calculateConfidence(20, 18), "low");
});
