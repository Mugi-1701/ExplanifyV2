const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const organizationRoutes = require("../modules/organizations/organization.routes");
const projectRoutes = require("../modules/projects/project.routes");
const taskRoutes = require("../modules/tasks/task.routes");
const usersRoutes = require("../modules/users/routes");
const teamsRoutes = require("../modules/teams/routes");
const aiRoutes = require("../modules/ai/routes");
const aiExplanationsRoutes = require("../modules/ai-explanations/routes");
const notificationsRoutes = require("../modules/notifications/routes");
const eventsRoutes = require("../modules/events/routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", usersRoutes);
router.use("/teams", teamsRoutes);
router.use("/", aiRoutes);
router.use("/ai-explanations", aiExplanationsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/events", eventsRoutes);

module.exports = router;
