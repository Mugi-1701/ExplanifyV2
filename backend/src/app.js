const express = require("express");
const cors = require("cors");
const { json } = require("express");
const { requestId } = require("./middleware/request-id");
const { errorHandler } = require("./middleware/error-handler");
const { registerEventHandlers } = require("./events/register-handlers");
const routes = require("./routes");

const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(json({ limit: "2mb" }));
app.use(requestId());

registerEventHandlers();

app.use("/api", routes);

app.use(errorHandler());

module.exports = app;
