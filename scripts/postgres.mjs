import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";
import net from "node:net";
import pg from "pg";

const { Client } = pg;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const PORT = parseInt(process.env.PG_PORT || "5432", 10);
const USER = process.env.PG_USER || "postgres";
const DB_NAME = process.env.PG_DATABASE || "zedgift";
const DATA_DIR = process.env.PG_DATA_DIR || join(ROOT, ".pgdata");
const LOG_FILE = join(DATA_DIR, "postgres.log");

function findBinDir() {
  const candidates = join(ROOT, "node_modules", "@embedded-postgres");
  if (!existsSync(candidates)) return null;
  for (const entry of ["windows-x64", "darwin-arm64", "darwin-x64", "linux-x64", "linux-arm64"]) {
    const bin = join(candidates, entry, "native", "bin");
    if (existsSync(join(bin, "pg_ctl" + (process.platform === "win32" ? ".exe" : "")))) return bin;
  }
  return null;
}

const BIN = findBinDir();
if (!BIN) {
  console.error("PostgreSQL binaries not found. Run `npm install` first.");
  process.exit(1);
}

const ext = process.platform === "win32" ? ".exe" : "";
const exe = (name) => join(BIN, name + ext);

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd.split(/[\\/]/).pop()} failed: ${(res.stderr || res.stdout || "").trim().slice(0, 800)}`);
  }
  return res;
}

function tryListen(timeoutMs) {
  return new Promise((resolve) => {
    const s = net.connect({ host: "127.0.0.1", port: PORT });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => { s.destroy(); resolve(false); });
    s.setTimeout(timeoutMs, () => { s.destroy(); resolve(false); });
  });
}

async function isRunning() {
  return tryListen(1500);
}

async function waitForPort(timeoutMs = 90000) {
  const started = Date.now();
  while (true) {
    if (await tryListen(800)) return true;
    if (Date.now() - started > timeoutMs) return false;
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function connect(database = "postgres") {
  const client = new Client({ host: "127.0.0.1", port: PORT, user: USER, database, connectionTimeoutMillis: 8000 });
  await client.connect();
  return client;
}

async function ensureDatabase() {
  const client = await connect("postgres");
  try {
    const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Created database "${DB_NAME}".`);
    }
  } finally {
    await client.end();
  }
}

async function initIfNeeded() {
  if (existsSync(join(DATA_DIR, "PG_VERSION"))) return;
  mkdirSync(DATA_DIR, { recursive: true });
  console.log("Initialising local PostgreSQL cluster (first run)...");
  try {
    run(exe("initdb"), ["-D", DATA_DIR, "-U", USER, "--auth=trust", "--encoding=UTF8", "--locale=C", "-E", "UTF8"]);
  } catch (err) {
    console.error("initdb failed. If a previous attempt left partial files, delete the .pgdata folder and retry.");
    throw err;
  }
  console.log("Cluster initialised.");
}

async function up() {
  await initIfNeeded(); // ensure databaseDir exists before further steps
  if (await isRunning()) {
    await ensureDatabase();
    console.log(`✔ PostgreSQL already running on 127.0.0.1:${PORT} (database "${DB_NAME}")`);
    return;
  }
  const postgresBin = exe("postgres");
  const args = `"${postgresBin}" -D "${DATA_DIR}" -p ${PORT}`;
  if (process.platform === "win32") {
    // Launch detached so the parent process tree (and any tooling) cannot kill it.
    execSync(
      `cmd /c start "ZED PGSQL" /b cmd /c "${args} > "${LOG_FILE}" 2>&1"`,
      { stdio: "ignore", windowsHide: true },
    );
  } else {
    const { spawn } = await import("node:child_process");
    const child = spawn(postgresBin, ["-D", DATA_DIR, "-p", String(PORT)], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }
  const ok = await waitForPort();
  if (!ok) {
    const tail = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, "utf8").split("\n").slice(-15).join("\n") : "(no log)";
    throw new Error(`PostgreSQL did not start.\n${tail}`);
  }
  await ensureDatabase();
  console.log(`✔ PostgreSQL running on 127.0.0.1:${PORT} (database "${DB_NAME}")`);
  console.log(`  DATABASE_URL=postgresql://${USER}:***@127.0.0.1:${PORT}/${DB_NAME}`);
}

async function down() {
  if (!(await isRunning())) {
    console.log("PostgreSQL is not running.");
    return;
  }
  const res = spawnSync(exe("pg_ctl"), ["stop", "-D", DATA_DIR, "-m", "fast"], { encoding: "utf8" });
  if (res.status !== 0) {
    spawnSync("taskkill", ["/f", "/t", "/im", "postgres" + ext]);
  }
  console.log("✔ PostgreSQL stopped");
}

const command = process.argv[2] ?? "status";
(async () => {
  switch (command) {
    case "up":
      await up();
      break;
    case "down":
      await down();
      break;
    case "status": {
      console.log((await isRunning()) ? "✔ PostgreSQL is running" : "✘ PostgreSQL is not running");
      break;
    }
    default: {
      console.error("usage: node scripts/postgres.mjs <up|down|status>");
      process.exitCode = 1;
    }
  }
  process.exit(0);
})().catch((err) => {
  console.error(`✘ ${err.message}`);
  process.exit(1);
});