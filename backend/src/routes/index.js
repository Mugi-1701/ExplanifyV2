const express = require("express");
const usersRoutes = require("../modules/users/routes");
const teamsRoutes = require("../modules/teams/routes");
const projectsRoutes = require("../modules/projects/routes");
const tasksRoutes = require("../modules/tasks/routes");
const aiExplanationsRoutes = require("../modules/ai-explanations/routes");
const notificationsRoutes = require("../modules/notifications/routes");
const authRoutes = require("../modules/auth/auth.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/users", usersRoutes);
router.use("/teams", teamsRoutes);
router.use("/projects", projectsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/ai-explanations", aiExplanationsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/auth", authRoutes);

module.exports = router;
