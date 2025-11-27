"use client";

import { HoverCard } from "@radix-ui/react-hover-card";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Button } from "./ui/button";

const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full px-6 py-3  bg-[#1B1917] backdrop-blur-sm border-b border-zinc-700 flex items-center justify-between">
      <Link href="/" className="  tracking-tight">
        <h1 className="text-2xl  text-amber-50 glow-text">Build ai</h1>
      </Link>

      <div className="flex items-center gap-5">
        <Link href="/chat/new">
          <button className="text-sm text-zinc-400 hover:text-amber-100 transition-colors">
            Start Project
          </button>
        </Link>

        {session?.user ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 rounded-full hover:ring-1 hover:ring-primary/20 transition-all"
              >
                <Image
                  src={session.user.image ?? "/avatar-placeholder.png"}
                  alt="User"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white/30"
                />
              </Button>
            </HoverCardTrigger>

            <HoverCardContent className="w-64 p-4 space-y-3 bg-[#221f1b] backdrop-blur-md border-white/20">
              <div className="flex items-center gap-3">
                <Image
                  src={session.user.image ?? "/avatar-placeholder.png"}
                  alt="User"
                  width={44}
                  height={44}
                  className="rounded-full border-2 border-primary/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-muted-foreground">
                    {session.user.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-[#1B1917] text-muted-foreground hover:bg-[#1B1917] hover:text-destructive-foreground transition-colors"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <Link href="/login">
            <button className="text-sm text-zinc-400 hover:text-amber-100 transition-colors">
              Sign In
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
