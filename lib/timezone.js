import { formatTime12h } from "./time";

export const buildUtcDateFromCaracas = (dateString, timeString) => {
  const safeDate = String(dateString || "").trim();
  const safeTime = String(timeString || "").trim();
  if (!safeDate || !safeTime) return null;

  const [year, month, day] = safeDate.split("-").map((v) => parseInt(v, 10));
  const [hour, minute] = safeTime.slice(0, 5).split(":").map((v) => parseInt(v, 10));

  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) return null;
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
};

export const getYmdInTimeZone = (date, timeZone) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const y = get("year");
  const m = get("month");
  const d = get("day");
  if (!y || !m || !d) return "";
  return `${y}-${m}-${d}`;
};

export const formatTimeFromCaracasInZone = (dateString, timeString, timeZone) => {
  if (!dateString || !timeString) return "";

  if (timeZone === "America/Caracas") {
    return formatTime12h(timeString.slice(0, 5));
  }

  const utcDate = buildUtcDateFromCaracas(dateString, timeString);
  if (!utcDate) return formatTime12h(timeString.slice(0, 5));

  const timeLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(utcDate);

  const targetYmd = getYmdInTimeZone(utcDate, timeZone);
  if (!targetYmd || targetYmd === dateString) return timeLabel;

  const [by, bm, bd] = dateString.split("-").map((v) => parseInt(v, 10));
  const [ty, tm, td] = targetYmd.split("-").map((v) => parseInt(v, 10));
  if (![by, bm, bd, ty, tm, td].every((n) => Number.isFinite(n))) return timeLabel;

  const baseMidnightUtc = new Date(Date.UTC(by, bm - 1, bd));
  const targetMidnightUtc = new Date(Date.UTC(ty, tm - 1, td));
  const diffDays = Math.round((targetMidnightUtc - baseMidnightUtc) / 86400000);
  if (!diffDays) return timeLabel;

  const abs = Math.abs(diffDays);
  const dayWord = abs === 1 ? "día" : "días";
  const sign = diffDays > 0 ? "+" : "-";
  return `${timeLabel} (${sign}${abs} ${dayWord})`;
};

export const formatTimeRangeFromCaracasInZone = ({ dateString, timeRange, timeZone }) => {
  if (!timeRange) return "";
  const safeRange = String(timeRange);

  if (safeRange.includes(" - ")) {
    const [start, end] = safeRange.split(" - ");
    const startLabel = formatTimeFromCaracasInZone(dateString, start.trim(), timeZone);
    const endLabel = formatTimeFromCaracasInZone(dateString, end.trim(), timeZone);
    return `${startLabel} - ${endLabel}`;
  }

  return formatTimeFromCaracasInZone(dateString, safeRange.trim(), timeZone);
};
