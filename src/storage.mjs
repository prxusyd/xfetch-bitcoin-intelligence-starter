import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";

export async function atomicWrite(path, contents) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(contents, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporary, path);
    const directory = await open(dirname(path), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
export async function lockState(path) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  let file;
  try {
    file = await open(`${path}.lock`, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "A run lock exists. Check that no process is using this state file before removing its .lock file."
      );
    throw error;
  }
  try {
    await file.writeFile(
      JSON.stringify({ pid: process.pid, host: hostname(), startedAt: new Date().toISOString() })
    );
  } catch (error) {
    await file.close();
    await unlink(`${path}.lock`);
    throw error;
  }
  return async () => {
    await file.close();
    await unlink(`${path}.lock`);
  };
}
export async function readState(path, required = false) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" && !required) return undefined;
    if (error.code === "ENOENT")
      throw new Error(
        "Expected progress is missing. Restore the previous progress file; scheduled runs must not silently reset deduplication or unresolved charges."
      );
    throw error;
  }
}
