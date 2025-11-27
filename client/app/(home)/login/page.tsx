"use client";
import React from "react";
import { signIn } from "next-auth/react";
import { Sparkles, Zap, Code2 } from "lucide-react";

export default function page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-amber-500/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-32 w-3 h-3 bg-purple-500/20 rounded-full animate-pulse delay-75" />
      <div className="absolute bottom-32 left-40 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-150" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Welcome */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-6">
            <Sparkles className="h-9 w-9 text-amber-500 animate-pulse" />
            <h1 className="text-4xl font-semibold tracking-tight text-amber-50">
              Build ai
            </h1>
          </div>

          <p className="text-muted-foreground text-lg mb-8">
            Sign in to bring your ideas to life
          </p>

          {/* Feature highlights */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground/70 mb-8">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Fast builds</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>AI-powered</span>
            </div>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() => {
            signIn("google", { callbackUrl: "/" });
          }}
          className="w-full flex items-center justify-center gap-4 px-8 py-4 hover:bg-[#23201c] border border-muted-foreground rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group backdrop-blur-sm"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-lg font-medium text-muted-foreground">
            Continue with Google
          </span>
        </button>

        {/* Footer Text */}
        <p className="text-xs text-muted-foreground/60 text-center mt-6 leading-relaxed px-4">
          By signing in, you agree to our{" "}
          <a
            href="#"
            className="text-amber-500/80 hover:text-amber-500 underline underline-offset-2"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="text-amber-500/80 hover:text-amber-500 underline underline-offset-2"
          >
            Privacy Policy
          </a>
        </p>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-lg font-light">
            Build faster, deploy smarter, create better
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-8 text-xs text-muted-foreground/50">
            <span>Trusted by developers</span>
            <span>•</span>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}
