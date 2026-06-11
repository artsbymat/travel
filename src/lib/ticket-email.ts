import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { TicketEmail } from "@/components/template/ticketEmail";

type TicketEmailBooking = {
  bookingCode: string;
  customerName: string;
  customerEmail: string | null;
  pickupAddress: string | null;
  seatCount: number;
  totalAmount: unknown;
  seats: Array<{ seatNo: string }>;
  trip: {
    origin: string;
    destination: string;
    originDetail: string | null;
    destinationDetail: string | null;
    departureTime: Date;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  };
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0
});

export async function sendTicketEmail(booking: TicketEmailBooking) {
  if (!booking.customerEmail) {
    return {
      sent: false,
      warning: "Pembayaran berhasil, tetapi customer tidak memiliki email."
    };
  }

  const ticketUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/ticket?code=${encodeURIComponent(booking.bookingCode)}`;
  const pickup = booking.pickupAddress || booking.trip.originDetail || `Pool ${booking.trip.origin}`;
  const dropoff = booking.trip.destinationDetail || `Pool ${booking.trip.destination}`;
  const html = await render(
    TicketEmail({
      customerName: booking.customerName,
      bookingCode: booking.bookingCode,
      ticketUrl,
      route: `${booking.trip.origin} ke ${booking.trip.destination}`,
      departureDate: booking.trip.departureTime.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      departureTime:
        booking.trip.departureTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        }) + " WIB",
      seats: booking.seats.map((seat) => seat.seatNo).join(", "),
      passengerCount: booking.seatCount,
      pickup,
      dropoff,
      vehicle: `${booking.trip.vehicle.brand} ${booking.trip.vehicle.model}`,
      licensePlate: booking.trip.vehicle.licensePlate,
      totalAmount: currencyFormatter.format(Number(booking.totalAmount))
    })
  );

  await transporter.sendMail({
    from: process.env.NODEMAILER_USER!,
    to: booking.customerEmail,
    subject: `Tiket Digital ${booking.bookingCode}`,
    html,
  });

  return { sent: true };
}
