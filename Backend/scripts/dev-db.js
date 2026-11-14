// Starts a separate local development database. It never changes a running MongoDB installation.
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const net = require("node:net");
const { MongoClient } = require("mongoose").mongo;
const port = Number(process.env.DEV_MONGO_PORT || 27018);
let child;
async function main() {
  let executable = process.env.MONGOD_BINARY || "mongod";
  if (process.platform === "win32" && !process.env.MONGOD_BINARY) {
    const root = path.join(
      process.env.ProgramFiles || "C:/Program Files",
      "MongoDB",
      "Server",
    );
    const versions = await fs.readdir(root).catch(() => []);
    if (versions.length)
      executable = path.join(
        root,
        versions.sort((a, b) =>
          b.localeCompare(a, undefined, { numeric: true }),
        )[0],
        "bin",
        "mongod.exe",
      );
  }
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => reservation.close(resolve));
  const folder = path.resolve(__dirname, `../../.local/mongodb-${port}`);
  await fs.mkdir(folder, { recursive: true });
  child = spawn(
    executable,
    [
      "--dbpath",
      folder,
      "--bind_ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--replSet",
      "rs0",
    ],
    { windowsHide: true, stdio: "inherit" },
  );
  let launchError;
  child.on("error", (error) => {
    launchError = error;
  });
  const uri = `mongodb://127.0.0.1:${port}/?directConnection=true`;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 500 });
  try {
    for (let attempt = 0; ; attempt++) {
      if (launchError)
        throw new Error(
          "Cannot launch mongod. Install MongoDB or set MONGOD_BINARY to its executable.",
        );
      if (child.exitCode !== null)
        throw new Error(
          "MongoDB exited. Check whether DEV_MONGO_PORT is already occupied.",
        );
      try {
        await client.connect();
        break;
      } catch (error) {
        if (attempt > 30) throw error;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    try {
      await client
        .db("admin")
        .command({
          replSetInitiate: {
            _id: "rs0",
            members: [{ _id: 0, host: `127.0.0.1:${port}` }],
          },
        });
    } catch (error) {
      if (error.codeName !== "AlreadyInitialized") throw error;
    }
    console.log(
      `Development MongoDB: mongodb://127.0.0.1:${port}/neuralstore?replicaSet=rs0`,
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  child?.kill();
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child?.kill());
