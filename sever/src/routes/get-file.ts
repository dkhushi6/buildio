import Sandbox from "@e2b/code-interpreter";
import { Router } from "express";
import path from "path";
const router = Router();
router.post("/getfile", async (req, res) => {
  const { sandboxId, filePath } = req.body;
  if (!sandboxId) {
    return res.json({ message: "id missing" });
  }
  if (!filePath) {
    return res.json({ message: "filepath missing" });
  }
  console.log("filepath", filePath);
  const sandbox = await Sandbox.connect(sandboxId);
  if (!sandbox) {
    return res.json({ message: "sandbox not found of the given id" });
  }
  const file = await sandbox.files.read(filePath);
  console.log("the file content is", file);
  return res.json({ message: "file got", file });
});
export default router;
