import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT!;
const accountKey = process.env.AZURE_STORAGE_KEY!;
const containerName = "khushi-projects"; // same container

const sharedCred = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedCred
);

const containerClient = blobServiceClient.getContainerClient(containerName);

// ---------------------------------------------------
//  LOAD PROJECT FILES FOR GIVEN USER & PROJECT
// ---------------------------------------------------
export async function LoadProjectFromAzure(projectId: string, userId: string) {
  const prefix = `${projectId}.zip`; // because you are storing 1 ZIP per project

  const blockBlobClient = containerClient.getBlockBlobClient(prefix);

  // Download ZIP
  const downloadResponse = await blockBlobClient.download();
  const zipBuffer = await streamToBuffer(downloadResponse.readableStreamBody);

  // Extract ZIP content
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(zipBuffer);

  const zipEntries = zip.getEntries();

  const result: { path: string; content: string }[] = [];

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    result.push({
      path: entry.entryName, // "/home/user/src/app.js"
      content: entry.getData().toString(), // file text
    });
  }

  return result;
}

// Convert stream → buffer
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (d) => chunks.push(d));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
