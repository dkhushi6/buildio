import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  return NextResponse.json(token);
}
