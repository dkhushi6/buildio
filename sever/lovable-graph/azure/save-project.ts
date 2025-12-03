import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import Sandbox from "@e2b/code-interpreter";
import AdmZip from "adm-zip";
import { prisma } from "../../lib/prisma";
const IGNORE_PATHS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".idea",
  ".vscode",
  ".DS_Store",
  "tmp",
  "logs",
  ".bash_logout",
  ".bashrc",
  ".npm",
];
const shouldIgnore = (path: string) => {
  return IGNORE_PATHS.some((ignore) => path.includes(ignore));
};

const getFiles = async (sandboxId, path = ".") => {
  const sandbox = await Sandbox.connect(sandboxId);
  const entries = await sandbox.files.list(path);

  let files = [];
  for (const file of entries) {
    if (shouldIgnore(file.path)) {
      console.log("IGNORING:", file.path);
      continue;
    }
    if (file.type === "file") {
      console.log("its a file", file.path);
      const content = await sandbox.files.read(file.path);

      files.push({ path: file.path, content });
    } else if (file.type === "dir") {
      console.log("its a dir", file.path);

      const sub = await getFiles(sandboxId, file.path);
      files = files.concat(sub);
    }
  }
  return files;
};
const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
if (!accountName || !accountKey) {
  throw new Error("Azure storage environment variables are missing.");
}
//A file stored in the cloud as raw binary data
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);
// const blobService = BlobServiceClient.fromConnectionString(
//   process.env.AZURE_STORAGE_CONNECTION_STRING!
// );
//AdmZip()---
//Collect all files from sandbox--> Add each file to ZIP-->Convert ZIP into a buffer-->  Upload buffer to Azure blob storage
const containerName = "khushi-projects"; // create in Azure portal
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function SaveProjectsAzur(
  //   sandbox: Sandbox,
  sandboxId: string,
  projectId: string,
  userId: string
) {
  console.log("inside azure code");
  const zip = new AdmZip();
  const files = await getFiles(sandboxId);
  console.log("files arr from main function is", files);
  for (const file of files) {
    let zipPath = file.path;

    // Remove /home/user prefix
    if (zipPath.startsWith("/home/user/")) {
      zipPath = zipPath.replace("/home/user/", "");
    } else if (zipPath.startsWith("/home/user")) {
      zipPath = zipPath.replace("/home/user", "");
    }

    zip.addFile(zipPath, Buffer.from(file.content));

    console.log("file added to ZIP:", zipPath);
  }

  const blobName = `${projectId}.zip`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const zipBuffer = zip.toBuffer();
  await blockBlobClient.uploadData(zipBuffer, {
    blobHTTPHeaders: { blobContentType: "application/zip" },
  });
  console.log("blob url got", blockBlobClient.url);
  const oldProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });
  const blobUrl = blockBlobClient.url;
  if (oldProject) {
    await prisma.project.update({
      where: { id: projectId, userId },

      data: { zipUrl: blobUrl },
    });
    return;
  }
}
