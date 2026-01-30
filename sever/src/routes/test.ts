import { prisma } from "../../lib/prisma";
import { Router } from "express";
const router = Router();
router.post("/test", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ message: "no userId" });
  }
  const oldProjects = await prisma.project.findMany({
    where: { userId },
  });
  if (!oldProjects) {
    return res.json({ messages: "no project for this id found" });
  }

  return res.json({ message: "project found", projects: oldProjects });
});

export default router;
