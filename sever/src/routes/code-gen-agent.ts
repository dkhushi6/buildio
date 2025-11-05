import { google } from "@ai-sdk/google";
import { generateObject, tool } from "ai";
import { Router } from "express";
import { systemPrompt } from "../../lib/systemPrompt";
import z from "zod";
import path from "path";
type fileType = {
  path: string;
  content: string;
  lastModified: number;
  isBinary: boolean;
};
import Sandbox from "@e2b/code-interpreter";
import { projectFiles } from "../../lib/projectFiles";
const router = Router();
// const createBaseApp = async (sandbox) => {
//   //add base react app
//   for (const file of projectFiles as fileType[]) {
//     console.log("file", file);
//     // const fullPath = path.resolve(file.path || "");
//     // console.log("fullpath", fullPath);
//     // const dir = path.dirname(fullPath);
//     const filePath = file.path;
//     const dir = path.dirname(filePath);
//     console.log("DIR INSIDE BASEAPP", dir);
//     await sandbox.files.makeDir(dir);
//     console.log("DIR MADE IN SANDBOX");
//     await sandbox.files.write(filePath, file.content);
//     console.log("FILE ADDED MADE IN SANDBOX");
//   }
// };
const AppendBaseApp = async (sandbox, step) => {
  const filePath = step.path;
  const dir = path.dirname(filePath);
  console.log("DIR INSIDE AIApp", dir);
  await sandbox.files.makeDir(dir);
  console.log("DIR MADE IN SANDBOX AIApp");
  await sandbox.files.write(filePath, step.content);
  console.log("FILE ADDED MADE IN SANDBOX AIApp");
};
const stepSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("createFile"),
    content: z.string(),
    path: z.string(),
  }),
  z.object({
    action: z.literal("runCommand"),
    command: z.string(),
  }),
  z.object({
    action: z.literal("replaceFile"),
    content: z.string(),
    path: z.string(),
  }),
]);
const workflowSchema = z.object({ steps: z.array(stepSchema).nonempty() });

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

  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    messages: [{ role: "user", content: prompt }],
    schema: workflowSchema,
    system: systemPrompt,
    maxRetries: 0,
  });
  object.steps.push({ action: "runCommand", command: "npm run dev" });

  console.log("generated code", object);
  //looping through all steps
  for (const step of object.steps) {
    if (step.action === "createFile" || step.action === "replaceFile") {
      await AppendBaseApp(sandbox, step);
    } else if (step.action === "runCommand") {
      await sandbox.commands.run(step.command);
    }
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
