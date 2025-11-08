import Sandbox from "@e2b/code-interpreter";
import { Router } from "express";
import path from "path";
import { file } from "zod";
import { getFolderTree } from "../../lib/getFolderTree";
const router = Router();
router.post("/tree", async (req, res) => {
  const { sandboxId } = req.body;
  if (!sandboxId) {
    return res.json({ message: "id missing" });
  }
  const sandbox = await Sandbox.connect(sandboxId);
  if (!sandbox) {
    return res.json({ message: "sandbox not found of the given id" });
  }
  try {
    const files = await sandbox.files.list(".");
    console.log("before send to getfoldertree");
    const tree = await getFolderTree(sandbox, ".");
    // console.log("Tree generated:", tree);

    return res.json({ message: "got files", tree });
  } catch (err) {
    console.error("Error in /tree route:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
export default router;
