import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

await run("node", ["scripts/check-auth-migration-readiness.mjs"]);
await run("node", ["scripts/apply-supabase-firebase-migration.mjs"]);
await run("node", ["scripts/import-supabase-users-to-firebase.mjs"]);

console.log("Firebase auth migration finished.");
