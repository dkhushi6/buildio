"use client";
import axios from "axios";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
export interface Project {
  id: string;
  name?: string;
  userId: string;
  zipUrl?: string;
  createdAt: string;
}

export default function ProjectsList() {
  const [userId, setUserId] = useState("");

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("login first");
    } else {
      const uid = session?.user?.id as string;
      setUserId(uid);
    }
  }, [status]);
  console.log("userid", userId);
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    if (userId) {
      const fetchProjects = async () => {
        const res = await axios.post("http://localhost:8080/api/test", {
          userId,
        });
        console.log("projects are", res.data);
        setProjects(res.data.projects);
      };
      fetchProjects();
    }
  }, [session, projects]);
  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Your Projects</h1>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-2xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition shadow-sm hover:scale-[1.01]"
          >
            <h2 className="text-xl font-medium text-gray-800 mb-2 truncate">
              {project.name || "Untitled Project"}
            </h2>

            <p className="text-sm text-gray-500">
              Project ID: <span className="font-mono">{project.id}</span>
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );
}
