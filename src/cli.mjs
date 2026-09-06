import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import {
  parseWorkflowConfig,
  parseWorkflowCheckpoint,
  createWorkflowDemoTransport,
  createWorkflowHttpTransport,
  runWorkflow,
  workflowFiles
} from "../lib/workflow-templates/index.js";
import { atomicWrite, lockState, readState } from "./storage.mjs";

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: "string", default: "config/topic.json" },
      state: { type: "string" },
      out: { type: "string" },
      demo: { type: "boolean", default: false },
      resume: { type: "boolean", default: false },
      "require-state": { type: "boolean", default: false }
    }
  });
  const config = parseWorkflowConfig(JSON.parse(await readFile(resolve(values.config), "utf8")));
  const scope = `${values.demo ? "demo-" : ""}${config.template}`;
  const statePath = resolve(values.state ?? `state/${scope}.json`);
  const outputPath = resolve(values.out ?? `output/${scope}`);
  if (
    !values.demo &&
    (!process.env.XFETCH_API_KEY ||
      process.env.XFETCH_API_KEY === "replace_with_your_xfetch_api_key")
  )
    throw new Error(
      "Set XFETCH_API_KEY in .env or your environment before a live run. npm run demo works without a key."
    );
  const release = await lockState(statePath);
  let stop = false;
  const stopAfterRequest = () => {
    stop = true;
  };
  process.on("SIGINT", stopAfterRequest);
  process.on("SIGTERM", stopAfterRequest);
  try {
    const raw = await readState(statePath, values["require-state"] || values.resume);
    const previous = raw ? parseWorkflowCheckpoint(raw) : undefined;
    if (previous && previous.report.synthetic !== values.demo)
      throw new Error("Demo and live runs must use separate progress files.");
    const transport = values.demo
      ? createWorkflowDemoTransport()
      : createWorkflowHttpTransport({
          apiKey: process.env.XFETCH_API_KEY,
          baseUrl: process.env.XFETCH_API_BASE_URL
        });
    const result = await runWorkflow({
      config,
      transport,
      previous,
      resume: values.resume,
      synthetic: values.demo,
      shouldStop: () => stop,
      async onCheckpoint(checkpoint) {
        await atomicWrite(statePath, JSON.stringify(checkpoint, null, 2) + "\n");
        for (const [name, contents] of Object.entries(workflowFiles(checkpoint.report)))
          await atomicWrite(join(outputPath, name), contents);
      }
    });
    const r = result.report;
    process.stdout.write(
      JSON.stringify(
        {
          template: r.template,
          synthetic: r.synthetic,
          posts: r.posts.length,
          authors: r.authors.length,
          newPosts: r.newPostIds.length,
          credits: r.creditsCharged,
          unresolvedRequest: r.requestUncertain,
          seconds: r.durationMs / 1000,
          stop: r.stopReason,
          output: outputPath
        },
        null,
        2
      ) + "\n"
    );
    if (
      !["complete", "post_limit", "page_limit", "cancelled"].includes(r.stopReason)
    ) {
      process.stderr.write(r.message + "\n");
      process.exitCode = 1;
    }
  } finally {
    process.off("SIGINT", stopAfterRequest);
    process.off("SIGTERM", stopAfterRequest);
    await release();
  }
}
main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "The template could not finish."}\n`
  );
  process.exitCode = 1;
});
