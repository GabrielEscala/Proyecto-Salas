import { NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const NOTIFY_TO = "gabriel.guaderrama@escalabeds.com";

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, company, roomName, date, timeRange } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Nombre y apellido son obligatorios." },
        { status: 400 }
      );
    }

    const safe = (v) => String(v ?? "").trim();

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #0E7CFF;">Solicitud de asistencia — Pantallas</h2>
        <p style="margin: 0 0 16px;">Un usuario necesita asistencia para conectar las pantallas de <strong>${safe(roomName)}</strong>.</p>

        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
          <p style="margin: 0 0 6px;"><strong>Nombre:</strong> ${safe(firstName)} ${safe(lastName)}</p>
          <p style="margin: 0 0 6px;"><strong>Empresa:</strong> ${safe(company)}</p>
          <p style="margin: 0 0 6px;"><strong>Sala:</strong> ${safe(roomName)}</p>
          <p style="margin: 0 0 6px;"><strong>Fecha:</strong> ${safe(date)}</p>
          <p style="margin: 0;"><strong>Horario:</strong> ${safe(timeRange)}</p>
        </div>

        <p style="margin-top: 18px; color: #64748b; font-size: 12px;">Este correo fue enviado automáticamente desde el sistema de reservas.</p>
      </div>
    `;

    const result = await sendBookingEmail({
      to: NOTIFY_TO,
      subject: `Asistencia pantallas — ${safe(firstName)} ${safe(lastName)} — ${safe(roomName)}`,
      html
    });

    return NextResponse.json({ ok: result.ok, status: result.status }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al enviar notificación.", details: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
