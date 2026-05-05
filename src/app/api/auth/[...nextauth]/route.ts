/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { JWT } from 'next-auth/jwt';
import { compare } from "bcrypt";

export const authOptions = {
    session: {
        strategy: "jwt" as const,
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            type: "credentials",
            credentials: {
                email: {},
                password: {},
            },

            async authorize(credentials) {

                if (!credentials) {
                    return null;
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { role: true },
                });


                if (!user || !user.password || !credentials.password) throw new Error("User not found");

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) throw new Error("Wrong password");
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name as "SUPER_ADMIN" | "OWNER" | "STAFF" | "DRIVER",
                    vendorId: user.vendorId,
                    isActive: user.isActive,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: {
            token: JWT;
            user?: any;
        }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.vendorId = user.vendorId;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: JWT }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.vendorId = token.vendorId;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
