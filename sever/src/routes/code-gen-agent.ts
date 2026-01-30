import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { Router } from "express";
import { systemPrompt } from "../../lovable-graph/prompts/systemPrompt";

import path from "path";

import Sandbox from "@e2b/code-interpreter";
const router = Router();

export const AppendBaseApp = async (
  sandbox,
  { path: stepPath, content: stepContent },
) => {
  const filePath = stepPath;
  const dir = path.dirname(filePath);
  console.log("DIR INSIDE AIApp", dir);
  await sandbox.files.makeDir(dir);
  console.log("DIR MADE IN SANDBOX AIApp");
  await sandbox.files.write(filePath, stepContent);
  console.log("FILE ADDED MADE IN SANDBOX AIApp");
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
    model: google("gemini-2.5-pro"),
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
    console.log(textPart);
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
