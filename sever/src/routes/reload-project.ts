import { prisma } from "../../lib/prisma";
import { Router } from "express";

const router = Router();
router.post("/reload", async (req, res) => {
  const { projectId, userId } = req.body;
  if (!projectId) {
    return res.json({ message: "no projectId" });
  }
  if (!userId) {
    return res.json({ message: "no userId" });
  }
  const oldProject = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!oldProject) {
    return res.json({ messages: "no project for this id found" });
  }
  return res.json({ message: "project found", project: oldProject });
});

export default router;
