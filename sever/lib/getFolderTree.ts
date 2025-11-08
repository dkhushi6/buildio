import path from "path";
import { Sandbox } from "@e2b/code-interpreter";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export async function getFolderTree(
  sandbox: Sandbox,
  dirPath: string = "."
): Promise<FileNode> {
  console.log("in folder tree");
  const items = await sandbox.files.list(dirPath);
  const children: FileNode[] = [];

  for (const item of items) {
    const baseName = path.basename(item.path);

    if (
      baseName === "node_modules" ||
      baseName === ".git" ||
      baseName === ".cache" ||
      baseName === ".npm" ||
      baseName.startsWith(".e2b")
    ) {
      continue;
    }
    if (item.type === "file") {
      children.push({
        name: baseName,
        path: item.path,
        type: "file",
      });
    } else if (item.type === "dir") {
      const subTree = await getFolderTree(sandbox, item.path);
      children.push(subTree);
    }
  }

  return {
    name: path.basename(dirPath) || dirPath,
    path: dirPath,
    type: "folder",
    children,
  };
}
