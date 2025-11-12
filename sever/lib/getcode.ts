import { google } from "@ai-sdk/google";
import Sandbox from "@e2b/code-interpreter";
import { stepCountIs, streamText } from "ai";
import { systemPrompt } from "./systemPrompt";
import { createFile } from "./tools";
import { runCommand } from "./tools";
import { replaceFile } from "./tools";

export const getcode = async (prompt: string, socket) => {
  const sandbox = await Sandbox.create("9ltypddtnj1uhv1iv3u1");
  console.log("sandbox id is", sandbox.sandboxId);
  const { sandboxId } = sandbox;
  socket.emit("sandboxId", sandboxId);
  const host = sandbox.getHost(5173);
  const url = host;
  socket.emit("url", url);
  console.log("base app made");

  console.log("🔗 Base App is available at:", host);

  const { textStream } = streamText({
    model: google("gemini-2.5-pro"),
    toolChoice: "required",
    tools: {
      createFile: createFile(sandbox, socket),
      replaceFile: replaceFile(sandbox, socket),
      runCommand: runCommand(sandbox, socket),
    },

    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  for await (const textPart of textStream) {
    console.log(textPart);
  }

  socket.emit("done");

  console.log("🔗 App is available at:", host);
};
