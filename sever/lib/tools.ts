import z from "zod";
import { tool } from "langchain";
import Sandbox from "@e2b/code-interpreter";
import { AppendBaseApp } from "../src/routes/code-gen-agent";
import { logPreview } from "./logger";

export const createFile = (sandbox: Sandbox, socket) => {
  return tool(
    async ({ path, content }: { path: string; content: string }) => {
      console.log("createFile:", path);
      logPreview("createFile content:", content, 300);

      await AppendBaseApp(sandbox, { path, content });
      socket.emit("createFile", path);
      return `File replaced`;
    },
    {
      name: "createFile",
      description:
        "Create or replace a file at a given directory inside the sandbox",
      schema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file including filename and extension",
          ),
        content: z.string().describe("Content to write into the file"),
      }),
    },
  );
};

export const replaceFile = (sandbox: Sandbox, socket) => {
  return tool(
    async ({ path, content }: { path: string; content: string }) => {
      console.log("replaceFile:", path);
      logPreview("replaceFile content:", content, 300);

      await AppendBaseApp(sandbox, { path, content });
      socket.emit("replaceFile", path);
      return `File replaced`;
    },
    {
      name: "replaceFile",
      description: "Create  a file at a given directory inside the sandbox",
      schema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file including filename and extension",
          ),
        content: z.string().describe("Content to write into the file"),
      }),
    },
  );
};

export const runCommand = (sandbox: Sandbox, socket) => {
  return tool(
    async ({ command }: { command: string }) => {
      try {
        console.log("⚙️ Running command:", command);

        await sandbox.commands.run(command, { cwd: "/home/user" });
        socket.emit("runCmd", command);
        return `🛠️ Ran command: ${command}`;
      } catch (err) {
        if (command.includes("npm install")) {
          await sandbox.commands.run("npm install --legacy-peer-deps", {
            cwd: "/home/user",
          });
          socket.emit("runCmd", "npm install --legacy-peer-deps (fallback)", {
            cwd: "/home/user",
          });
        } else {
          socket.emit("runCmdError", err.result?.stderr || err.message);
        }
      }
    },
    {
      name: "runCommand",
      description: "Run a command inside sandbox",
      schema: z.object({
        command: z.string(),
      }),
    },
  );
};
