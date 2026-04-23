/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { JWT } from 'next-auth/jwt';
import { compare } from "bcrypt";

let prisma: PrismaClient | undefined;

function getPrismaClient() {
    if (prisma) {
        return prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
    });

    return prisma;
}

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
                    return null; // Jika credentials tidak ada, kembalikan null
                }
                const user = await getPrismaClient().user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password || !credentials.password) throw new Error("User not found");

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) throw new Error("Wrong password");

                return user;
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
            }
            return token;
        },
        async session({ session, token }: { session: any; token: JWT }) {
            session.user.id = token.id;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
