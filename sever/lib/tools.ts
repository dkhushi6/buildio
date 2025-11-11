import z from "zod";
import { tool } from "ai";
import Sandbox from "@e2b/code-interpreter";
import { AppendBaseApp } from "../src/routes/code-gen-agent";

export const createFile = (sandbox: Sandbox, socket) => {
  return tool({
    description: "Replace a file at a certain directory",
    inputSchema: z.object({
      path: z
        .string()
        .describe("relative path to the file with filename and extention"),
      content: z.string().describe("content of the file"),
    }),
    execute: async ({ path, content }: { path: string; content: string }) => {
      console.log("content is create file", content);

      await AppendBaseApp(sandbox, { path, content });
      console.log("path is create file", path);
      socket.emit("createFile", path);

      return `File replaced`;
    },
  });
};

export const replaceFile = (sandbox: Sandbox, socket) => {
  return tool({
    description: "Replace a file at a certain directory",
    inputSchema: z.object({
      path: z
        .string()
        .describe("relative path to the file with filename and extention"),

      content: z.string().describe("content of the file"),
    }),
    async execute({ path, content }: { path: string; content: string }) {
      console.log("path is replace file", path);
      console.log("content is replace file", content);

      await AppendBaseApp(sandbox, { path, content });
      socket.emit("replaceFile", path);
      return `File replaced`;
    },
  });
};

export const runCommand = (sandbox: Sandbox, socket) => {
  return tool({
    description: "Run a shell command inside sandbox",
    inputSchema: z.object({
      command: z.string(),
    }),
    async execute({ command }: { command: string }) {
      await sandbox.commands.run(command);
      socket.emit("runCmd", command);
      return `🛠️ Ran command: ${command}`;
    },
  });
};
