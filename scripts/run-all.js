// Runs several npm scripts in parallel, propagating exit codes.
// Usage: node scripts/run-all.js <script> [script ...]
const { spawn } = require("child_process");

const tasks = process.argv.slice(2);
if (!tasks.length) {
    console.error("Usage: node scripts/run-all.js <script> [script ...]");
    process.exit(1);
}

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const children = [];
let exiting = false;

function killAll(code) {
    if (exiting) {
        return;
    }
    exiting = true;
    for (const child of children) {
        if (child.exitCode === null) {
            try {
                child.kill();
            } catch (_) {
                // ignore
            }
        }
    }
    process.exit(code);
}

for (const task of tasks) {
    const child = spawn(npmCmd, ["run", task], {
        stdio: "inherit",
        shell: isWin,
    });
    children.push(child);

    child.on("error", (err) => {
        console.error(`[run-all] failed to start "${task}":`, err.message);
        killAll(1);
    });

    child.on("exit", (code) => {
        const codeNum = code === null ? 1 : code;
        if (codeNum !== 0) {
            console.error(`[run-all] "${task}" exited with code ${codeNum}`);
            killAll(codeNum);
        } else {
            console.log(`[run-all] "${task}" finished`);
            if (children.every((c) => c.exitCode !== null)) {
                process.exit(0);
            }
        }
    });
}

for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => killAll(130));
}
