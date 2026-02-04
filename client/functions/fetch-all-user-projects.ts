import { project } from "@/lib/generated/prisma";
import axios from "axios";
type fetchProjectsPropsTypes = {
  userId: string;
  setProjects: React.Dispatch<React.SetStateAction<project[]>>;
};
export const fetchProjects = async ({
  userId,
  setProjects,
}: fetchProjectsPropsTypes) => {
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/test`, {
    userId,
  });
  console.log("projects are", res.data);
  setProjects(res.data.projects);
};
