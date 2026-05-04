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

        // Cari token yang valid
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return Response.json(
                { error: "Link reset password tidak valid." },
                { status: 400 },
            );
        }

        if (resetToken.used) {
            return Response.json(
                { error: "Link reset password sudah pernah digunakan." },
                { status: 400 },
            );
        }

        if (resetToken.expiresAt < new Date()) {
            return Response.json(
                { error: "Link reset password sudah kadaluarsa. Silakan minta link baru." },
                { status: 400 },
            );
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password & tandai token sudah dipakai dalam satu transaksi
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        return Response.json(
            { message: "Password berhasil diubah. Silakan login dengan password baru kamu." },
            { status: 200 },
        );
    } catch (error) {
        console.error("[reset-password]", error);
        return Response.json(
            { error: "Gagal mereset password. Coba lagi nanti." },
            { status: 500 },
        );
    }
}
