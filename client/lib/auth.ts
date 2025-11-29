import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
// import { prisma } from "./prisma";
interface JWTToken {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },

  //   adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // token.id was set in jwt callback
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
});
