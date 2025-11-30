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
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
  "tmp",
  "logs",
  ".env",
];
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
  sandbox: Sandbox,
  projectId: string,
  userId: string
) {
  console.log("inside azure code");
  const zip = new AdmZip();
  const files = await sandbox.files.list("/");

  for (const file of files) {
    const shouldIgnore = IGNORE_PATHS.some((ignore) =>
      file.path.startsWith(ignore)
    );
    console.log("file is", file);
    if (shouldIgnore) continue;
    const content = await sandbox.files.read(file.path);
    zip.addFile(file.path, Buffer.from(content));
  }
  const blobName = `${projectId}.zip`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const zipBuffer = zip.toBuffer();
  await blockBlobClient.uploadData(zipBuffer, {
    blobHTTPHeaders: { blobContentType: "application/zip" },
  });
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
