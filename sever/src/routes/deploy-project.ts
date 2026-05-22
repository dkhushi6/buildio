import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import Sandbox from "@e2b/code-interpreter";
import { Router } from "express";
import path from "path";
import { shortLog } from "../../lib/logger";

type DeployFile = {
  path: string;
  content: string;
};

const router = Router();

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const staticWebsiteUrl = process.env.AZURE_STATIC_WEBSITE_URL?.replace(
  /\/+$/,
  "",
);

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
  };

  return types[ext] ?? "application/octet-stream";
};

const collectFiles = async (
  sandbox: Sandbox,
  dir = "/home/user/dist",
): Promise<DeployFile[]> => {
  const entries = await sandbox.files.list(dir);
  const files: DeployFile[] = [];

  for (const entry of entries) {
    if (entry.type === "dir") {
      files.push(...(await collectFiles(sandbox, entry.path)));
      continue;
    }

    const content = await sandbox.files.read(entry.path);
    files.push({ path: entry.path, content });
  }

  return files;
};

router.post("/deploy", async (req, res) => {
  const { sandboxId, projectId } = req.body;

  if (!sandboxId) {
    return res.status(400).json({ message: "sandboxId missing" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "projectId missing" });
  }
  if (!accountName || !accountKey) {
    return res.status(500).json({ message: "Azure storage env missing" });
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId);

    console.log("deploy build started:", { sandboxId, projectId });
    await sandbox.commands.run("npm run build -- --base=./", {
      cwd: "/home/user",
      timeoutMs: 180000,
    });

    const files = await collectFiles(sandbox);
    console.log("deploy files collected:", files.length);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential,
    );
    const containerClient = blobServiceClient.getContainerClient("$web");
    await containerClient.createIfNotExists();

    let indexBlobUrl = "";
    for (const file of files) {
      const relativePath = file.path.replace(/^\/home\/user\/dist\/?/, "");
      if (!relativePath) continue;

      const blobName = `${projectId}/${relativePath}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(Buffer.from(file.content), {
        blobHTTPHeaders: { blobContentType: getContentType(relativePath) },
      });

      if (relativePath === "index.html") {
        indexBlobUrl = blockBlobClient.url;
      }
    }

    const deployUrl = staticWebsiteUrl
      ? `${staticWebsiteUrl}/${projectId}/`
      : indexBlobUrl;

    console.log("deploy complete:", shortLog(deployUrl, 240));
    return res.json({
      message: "deployed",
      deployUrl,
      files: files.length,
      needsStaticWebsiteUrl: !staticWebsiteUrl,
    });
  } catch (err) {
    const commandError = err as {
      result?: { stdout?: string; stderr?: string };
      message?: string;
    };
    const error = [
      commandError.result?.stdout,
      commandError.result?.stderr,
      commandError.message,
    ]
      .filter(Boolean)
      .join("\n");

    console.error("deploy failed:", shortLog(error || err, 1000));
    return res.status(500).json({
      message: "deploy failed",
      error: error || String(err),
    });
  }
});

export default router;
