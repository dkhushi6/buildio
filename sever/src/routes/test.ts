import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { ReloadOldProject } from "../../lovable-graph/azure/reload-old-project";
const router = Router();
router.post("/test", async (req, res) => {
  console.log("DB URL inside route:", process.env.DATABASE_URL);

  const { userId } = req.body;
  console.log("DB URL inside route:", process.env.DATABASE_URL);

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
