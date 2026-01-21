"use client";
import { ResizableBar } from "@/components/resizeable-bar-comp/resizeable-bar";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ObjectId } from "bson";
import axios from "axios";
import { useSession } from "next-auth/react";
const page = () => {
  const params = useParams();
  const id = params.id as string | undefined;
  const [projectId, setprojectId] = useState("");
  const [userId, setUserId] = useState("");
  const [reload, setReload] = useState(false);

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
  useEffect(() => {
    if (id === "new" || !id) {
      //generate a chat id
      const idg = new ObjectId().toHexString();
      setprojectId(idg);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", `/chat/${idg}`);
      }
      console.log("Id new chat generated", idg);
    } else {
      setprojectId(id);
    }
  }, [id]);
  useEffect(() => {
    if (id && id !== "new" && userId) {
      console.log("initialid", id);
      console.log("old project");
      const handleReload = async () => {
        setReload(true);
        const res = await axios.post("http://localhost:8080/api/reload", {
          projectId: id,
          userId,
        });
        console.log("project", res.data);
        console.log("messages", res.data.project.messages);
      };
      handleReload();
    }
  }, [id, userId]);
  return (
    <div>
      <ResizableBar projectId={projectId} reload={reload} />
    </div>
  );
};

export default page;
