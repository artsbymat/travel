import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || typeof token !== "string") {
            return Response.json({ error: "Token tidak valid." }, { status: 400 });
        }

        if (!password || typeof password !== "string" || password.length < 8) {
            return Response.json(
                { error: "Password minimal harus 8 karakter." },
                { status: 400 },
            );
        }

        const inviteToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!inviteToken) {
            return Response.json(
                { error: "Link undangan tidak valid." },
                { status: 400 },
            );
        }

        if (inviteToken.used) {
            return Response.json(
                { error: "Link undangan sudah pernah digunakan." },
                { status: 400 },
            );
        }

        if (inviteToken.expiresAt < new Date()) {
            return Response.json(
                { error: "Link undangan sudah kadaluarsa. Hubungi admin untuk mendapatkan undangan baru." },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: inviteToken.userId },
                data: {
                    password: hashedPassword,
                    isActive: true,
                },
            }),
            prisma.passwordResetToken.update({
                where: { id: inviteToken.id },
                data: { used: true },
            }),
        ]);

        return Response.json(
            { message: "Akun berhasil diaktifkan. Silakan login." },
            { status: 200 },
        );
    } catch (error) {
        console.error("[accept-invitation]", error);
        return Response.json(
            { error: "Terjadi kesalahan. Coba lagi nanti." },
            { status: 500 },
        );
    }
}
