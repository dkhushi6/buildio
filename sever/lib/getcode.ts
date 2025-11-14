import Sandbox from "@e2b/code-interpreter";
import { buildAgent } from "../lib/graph";
import { createAgent, HumanMessage } from "langchain";
import { createFile, replaceFile, runCommand } from "./tools";
import { systemPrompt } from "./systemPrompt";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { runMathGraph } from "./dummy/dummyTools";
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
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    temperature: 0.7,
    maxOutputTokens: 30000, // or 8192
  });
  // const res = await runMathGraph(model, prompt);

  await buildAgent(prompt, sandbox, socket, model);

  // const agent = createAgent({
  //   model,
  //   tools: [
  //     createFile(sandbox, socket),
  //     replaceFile(sandbox, socket),
  //     runCommand(sandbox, socket),
  //   ],
  // });

  // for await (const chunk of await agent.stream(
  //   {
  //     messages: [
  //       { role: "system", content: systemPrompt },
  //       { role: "user", content: prompt },
  //     ],
  //   },
  //   { streamMode: "custom" }
  // )) {
  //   console.log(chunk);
  // }

  socket.emit("done");

  console.log("🔗 App is available at:", host);
};
