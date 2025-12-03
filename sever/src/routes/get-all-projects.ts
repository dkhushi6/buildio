import { prisma } from "../../lib/prisma";

import { Router } from "express";
const router = Router();
router.post("/user-project", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.json({ message: "no user id found" });
  }
  const user = await prisma.user.findFirst({ where: { id: userId } });
  console.log("user is", user);
  //   const userWithProjects = await prisma.user.findUnique({
  //     where: { id: userId },
  //     include: { project: true },
  //   });

  //   if (!userWithProjects) {
  //     return res.status(404).json({ message: "User not found" });
  //   }
  //   return res.json({
  //     message: "Projects fetched successfully",
  //     projects: userWithProjects.project,
  //   });
  return res.json({ message: "ok" });
});
export default router;
