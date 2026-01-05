import nodemailer from "nodemailer";

const getMailtrapConfig = () => {
  const host = process.env.MAILTRAP_HOST;
  const port = process.env.MAILTRAP_PORT ? Number(process.env.MAILTRAP_PORT) : undefined;
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;
  const from = process.env.MAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { provider: "mailtrap", host, port, user, pass, from, secure: false };
};

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const secure =
    typeof process.env.SMTP_SECURE === "string"
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { provider: "smtp", host, port, user, pass, from, secure };
};

const getResendConfig = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = (process.env.RESEND_FROM_EMAIL || "").trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
};

const isValidEmail = (value) => {
  const v = String(value || "").trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
};

const extractEmailFromFromField = (from) => {
  const str = String(from || "").trim();
  const match = str.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  return str;
};

const sendViaResend = async ({ to, subject, html }) => {
  const cfg = getResendConfig();
  if (!cfg) return { ok: false, provider: "resend", status: "skipped", reason: "missing_resend_config" };
  if (!to) return { ok: false, provider: "resend", status: "skipped", reason: "missing_to" };

  const fromEmail = extractEmailFromFromField(cfg.from);
  if (!isValidEmail(fromEmail)) {
    const shown = String(cfg.from || "").trim().slice(0, 120);
    return {
      ok: false,
      provider: "resend",
      status: "error",
      error: `RESEND_FROM_EMAIL inválido: "${shown}". Usa email@dominio.com o Nombre <email@dominio.com>.`
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: cfg.from,
        to: [to],
        subject,
        html
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        provider: "resend",
        status: "error",
        error: (payload?.message || payload?.error || `Resend error ${response.status}`).slice(0, 200)
      };
    }

    return { ok: true, provider: "resend", status: "sent", messageId: payload?.id || null };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      status: "error",
      error: (error?.message || String(error)).slice(0, 200)
    };
  }
};

export const sendBookingEmail = async ({
  to,
  subject,
  html
}) => {
  const resendCfg = getResendConfig();
  if (resendCfg) {
    return await sendViaResend({ to, subject, html });
  }

  const smtpCfg = getSmtpConfig();
  if (smtpCfg) {
    if (!to) return { ok: false, provider: smtpCfg.provider, status: "skipped", reason: "missing_to" };

    try {
      const transporter = nodemailer.createTransport({
        host: smtpCfg.host,
        port: smtpCfg.port,
        secure: smtpCfg.secure,
        auth: {
          user: smtpCfg.user,
          pass: smtpCfg.pass
        }
      });

      await transporter.verify();

      const info = await transporter.sendMail({
        from: smtpCfg.from,
        to,
        subject,
        html
      });

      return { ok: true, provider: smtpCfg.provider, status: "sent", messageId: info?.messageId || null };
    } catch (error) {
      return {
        ok: false,
        provider: smtpCfg.provider,
        status: "error",
        error: (error?.message || String(error)).slice(0, 200)
      };
    }
  }

  const cfg = getMailtrapConfig();
  if (!cfg) return { ok: false, provider: "mailtrap", status: "skipped", reason: "missing_config" };
  if (!to) return { ok: false, provider: "mailtrap", status: "skipped", reason: "missing_to" };

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      html
    });

    return { ok: true, provider: "mailtrap", status: "sent", messageId: info?.messageId || null };
  } catch (error) {
    return {
      ok: false,
      provider: "mailtrap",
      status: "error",
      error: (error?.message || String(error)).slice(0, 200)
    };
  }
};

export const buildBookingEmailHtml = ({
  firstName,
  lastName,
  company,
  roomName,
  date,
  timeRange,
  cancelCode,
  cancelUrl
}) => {
  const safe = (v) => String(v ?? "");

  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Reserva confirmada</h2>
      <p style="margin: 0 0 16px;">Hola <strong>${safe(firstName)} ${safe(lastName)}</strong>, tu reserva fue registrada.</p>

      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
        <p style="margin: 0 0 6px;"><strong>Sala:</strong> ${safe(roomName)}</p>
        <p style="margin: 0 0 6px;"><strong>Fecha:</strong> ${safe(date)}</p>
        <p style="margin: 0 0 6px;"><strong>Horario:</strong> ${safe(timeRange)}</p>
        <p style="margin: 0;"><strong>Empresa:</strong> ${safe(company)}</p>
      </div>

      <div style="margin-top: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px; background: #f8fafc;">
        <p style="margin: 0 0 8px;"><strong>Código de gestión:</strong> <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${safe(cancelCode)}</span></p>
        <p style="margin: 0;">Para ver, editar o cancelar tu reserva usa este enlace:</p>
        <p style="margin: 6px 0 0;"><a href="${safe(cancelUrl)}">${safe(cancelUrl)}</a></p>
      </div>

      <p style="margin-top: 18px; color: #64748b; font-size: 12px;">Si no reconoces esta reserva, ignora este correo.</p>
    </div>
  `;
};
