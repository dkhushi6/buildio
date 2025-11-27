"use client";
import LandingPage from "@/components/home-comp/heros-section";
import { ResizableBar } from "@/components/resizeable-bar-comp/resizeable-bar";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

const page = () => {
  const { data: session } = useSession();
  useEffect(() => {
    if (!session) {
      console.log("no session");
    }
    console.log("session is", session);
  });
  return (
    <div>
      <LandingPage />
    </div>
  );
};

export default page;
