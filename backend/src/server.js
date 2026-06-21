const { createServer } = require("http");
const app = require("./app");
const { env } = require("./config/env");

const server = createServer(app);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${env.port} is already in use.\nEither stop the existing process or change PORT in .env.\n`);
    process.exit(1);
  } else {
    throw error;
  }
});

server.listen(env.port, () => {
  console.log(`Explanify backend listening on port ${env.port}`);
});
