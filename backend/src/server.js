const { createServer } = require("http");
const app = require("./app");
const { env } = require("./config/env");

const server = createServer(app);

server.listen(env.port, () => {
  console.log(`Explanify backend listening on port ${env.port}`);
});
