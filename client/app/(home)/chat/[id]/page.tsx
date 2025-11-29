"use client";
import { ResizableBar } from "@/components/resizeable-bar-comp/resizeable-bar";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ObjectId } from "bson";
const page = () => {
  const params = useParams();
  const id = params.id as string | undefined;
  const [projectId, setprojectId] = useState("");
  useEffect(() => {
    if (id === "new" || !id) {
      //generate a chat id
      const idg = new ObjectId().toHexString();
      setprojectId(idg);
      console.log("Id new chat generated", idg);
    } else {
      setprojectId(id);
    }
  }, []);
  return (
    <div>
      <ResizableBar projectId={projectId} />
    </div>
  );
};

export default page;
