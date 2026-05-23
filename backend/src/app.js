const express = require("express");
const cors = require("cors");
const { json } = require("express");
const { requestId } = require("./middleware/request-id");
const { errorHandler } = require("./middleware/error-handler");
const { registerEventHandlers } = require("./events/register-handlers");
const routes = require("./routes");
const organizationRoutes = require("./modules/organizations/organization.routes");
const projectRoutes = require("./modules/projects/project.routes");
const taskRoutes = require("./modules/tasks/task.routes");

const app = express();

app.use(cors());
app.use(json({ limit: "2mb" }));
app.use(requestId());

registerEventHandlers();

console.log("[Route Register] Registering organization routes at /api/organizations");
app.use("/api/organizations", organizationRoutes);

console.log("[Route Register] Registering project routes at /api/projects");
app.use("/api/projects", projectRoutes);

console.log("[Route Register] Registering task routes at /api/tasks");
app.use("/api/tasks", taskRoutes);

app.use("/api", routes);

app.use(errorHandler());

module.exports = app;
