import Sandbox from "@e2b/code-interpreter";
import { LoadProjectFromAzure } from "./loader";
import path from "path";
type ReloadOldProjectPropTypes = {
  projectId: string;
  userId: string;
};
export async function ReloadOldProject({
  projectId,
  userId,
}: ReloadOldProjectPropTypes) {
  const sandbox = await Sandbox.create("9ltypddtnj1uhv1iv3u1");
  console.log("baseApp created");
  const { sandboxId } = sandbox;
  const host = sandbox.getHost(5173);
  const url = host;
  console.log("newSandbox url");
  const projectFiles = await LoadProjectFromAzure(projectId, userId);
  console.log("fetched all projectfiles from sandbox");

  for (const file of projectFiles) {
    const filePath = file.path;

    const dir = path.dirname(filePath);
    console.log("DIR INSIDE AIApp", dir);
    await sandbox.files.makeDir(dir);
    console.log("DIR MADE IN SANDBOX AIApp");
    await sandbox.files.write(filePath, file.content);
    console.log("file added to sandbox", file);
  }
  console.log("all files added to sandbox");

  await sandbox.commands.run("npm install --legacy-peer-deps", {
    cwd: "/home/user",
  });

  console.log("npm i cmd runned");
  return { url, sandboxId };
}
