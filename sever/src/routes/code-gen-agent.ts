import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { Router } from "express";
import { systemPrompt } from "../../lovable-graph/prompts/systemPrompt";

import path from "path";

import Sandbox from "@e2b/code-interpreter";
import { logPreview } from "../../lib/logger";
const router = Router();

export const AppendBaseApp = async (
  sandbox,
  { path: stepPath, content: stepContent },
) => {
  const filePath = stepPath;
  const dir = path.dirname(filePath);
  console.log("write file dir:", dir);
  await sandbox.files.makeDir(dir);
  await sandbox.files.write(filePath, stepContent);
  console.log("file written:", filePath);
};

router.post("/getcode", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.json({ message: "no msg recieved" });
  }

  const sandbox = await Sandbox.create("9ltypddtnj1uhv1iv3u1");
  console.log("sandbox id is", sandbox.sandboxId);
  const { sandboxId } = sandbox;
  const host = sandbox.getHost(5173);
  const url = host;

  console.log("base app made");
  console.log("🔗 Base App is available at:", host);

  const { textStream } = streamText({
    model: google("gemini-3.1-pro-previewo"),
    toolChoice: "required",
    // tools: {
    //   createFile: createFile(sandbox),
    //   replaceFile: replaceFile(sandbox),
    //   runCommand: runCommand(sandbox),
    // },

    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  for await (const textPart of textStream) {
    logPreview("stream text:", textPart, 300);
  }

  console.log("🔗 App is available at:", host);

  return res.json({
    message: "generate code successfully",
    url,
    status: "ok",
    sandboxId,
  });
});
export default router;
