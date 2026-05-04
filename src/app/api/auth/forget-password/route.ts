import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { ResetPasswordEmail } from "@/components/template/emailTemplate";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.NODEMAILER_USER!,
        pass: process.env.NODEMAILER_PASSWORD!,
    },
});

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return Response.json({ error: "Email is required" }, { status: 400 });
        }

        // Cari user berdasarkan email — selalu return 200 agar email tidak bisa di-enumerate
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Hapus token lama yang belum terpakai milik user ini
            await prisma.passwordResetToken.deleteMany({
                where: { userId: user.id, used: false },
            });

            // Buat token baru yang kuat (32 bytes = 64 hex chars)
            const token = randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 jam

            await prisma.passwordResetToken.create({
                data: { token, userId: user.id, expiresAt },
            });

            const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

            const html = await render(
                ResetPasswordEmail({
                    userName: user.name ?? undefined,
                    resetToken: token,
                    baseUrl,
                    expiresInHours: 1,
                }),
            );

            try {
                await transporter.sendMail({
                    from: process.env.NODEMAILER_USER!,
                    to: email,
                    subject: "Reset Password Akun Kamu",
                    html,
                });
                console.log("[forget-password] Email sent to:", email);
            } catch (mailError) {
                console.error("[forget-password] Nodemailer error:", mailError);
                return Response.json(
                    { error: "Gagal mengirim email. Coba lagi nanti." },
                    { status: 500 },
                );
            }
        }

        return Response.json(
            {
                message:
                    "Jika email terdaftar, link reset password telah dikirim ke inbox kamu.",
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("[forget-password]", error);
        return Response.json(
            { error: "Gagal mengirim email. Coba lagi nanti." },
            { status: 500 },
        );
    }
}
