import {
  addMinutes,
  format,
  isBefore,
  isEqual,
  parse,
  parseISO
} from "date-fns";
import { DATE_FORMAT, TIME_CONFIG } from "./constants";

const TIME_PATTERN = "HH:mm";

const DEFAULT_TIME_ZONE = "America/Caracas";

const getZonedParts = (date, timeZone = DEFAULT_TIME_ZONE) => {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = dtf.formatToParts(date);
  const out = {};
  for (const p of parts) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
};

export const getTodayString = (now = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const p = getZonedParts(now, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
};

export const getCurrentTimeString = (now = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const p = getZonedParts(now, timeZone);
  return `${p.hour}:${p.minute}`;
};

export const generateTimeSlots = (config = TIME_CONFIG) => {
  const slots = [];
  let cursor = parse(config.startTime, TIME_PATTERN, new Date());
  const end = parse(config.endTime, TIME_PATTERN, new Date());

  while (isBefore(cursor, end) || isEqual(cursor, end)) {
    slots.push(format(cursor, TIME_PATTERN));
    cursor = addMinutes(cursor, config.intervalMinutes);
  }

  return slots;
};

export const slotToDate = (dateString, timeString) =>
  parse(`${dateString} ${timeString}`, `${DATE_FORMAT} ${TIME_PATTERN}`, new Date());

export const isDateBeforeToday = (dateString, now = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const todayString = getTodayString(now, timeZone);
  return String(dateString || "") < todayString;
};

export const isSlotInPast = (dateString, timeString, now = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const todayString = getTodayString(now, timeZone);
  const currentTime = getCurrentTimeString(now, timeZone);
  const slotTime = timeString?.length ? timeString.slice(0, 5) : timeString;
  const date = String(dateString || "");

  if (!date || !slotTime) return false;
  if (date < todayString) return true;
  if (date > todayString) return false;
  return String(slotTime) < currentTime;
};

export const getNextAvailableSlot = (slots, bookings, dateString, fromTime) => {
  const bookedTimes = new Set(bookings.map((booking) => booking.time));
  const startLooking =
    fromTime || slots[0];

  let shouldCheck = false;
  for (const slot of slots) {
    if (!shouldCheck && slot === startLooking) {
      shouldCheck = true;
    }

    if (shouldCheck && !bookedTimes.has(slot) && !isSlotInPast(dateString, slot)) {
      return slot;
    }
  }

  return null;
};

export const buildAvailabilityRanges = (slotStates = []) => {
  if (!slotStates.length) return [];
  const ranges = [];
  let current = { status: slotStates[0].status, from: slotStates[0].time };

  for (let i = 1; i < slotStates.length; i += 1) {
    const slot = slotStates[i];
    if (slot.status === current.status) {
      continue;
    }

    ranges.push({ ...current, to: slotStates[i - 1].time });
    current = { status: slot.status, from: slot.time };
  }

  ranges.push({ ...current, to: slotStates[slotStates.length - 1].time });
  return ranges;
};

export const getSlotEndTime = (timeString, config = TIME_CONFIG) => {
  const slot = parse(timeString, TIME_PATTERN, new Date());
  return format(addMinutes(slot, config.intervalMinutes), TIME_PATTERN);
};

/**
 * Convierte un tiempo en formato 24h (HH:mm) a formato 12h AM/PM
 * @param {string} timeString - Tiempo en formato HH:mm (ej: "14:30")
 * @returns {string} - Tiempo en formato 12h AM/PM (ej: "2:30 PM")
 */
export const formatTime12h = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "p. m." : "a. m.";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Agrupa reservas consecutivas de la misma persona en la misma sala
 * Retorna un array de reservas agrupadas con rangos de tiempo
 */
export const groupConsecutiveBookings = (bookings = []) => {
  if (!bookings.length) return [];

  // Ordenar por sala, persona y hora
  const sorted = [...bookings].sort((a, b) => {
    const roomCompare = (a.room_id || a.room_name || "").localeCompare(b.room_id || b.room_name || "");
    if (roomCompare !== 0) return roomCompare;
    
    const personCompare = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    if (personCompare !== 0) return personCompare;
    
    return (a.time || "").localeCompare(b.time || "");
  });

  const grouped = [];
  let currentGroup = null;

  for (const booking of sorted) {
    const personKey = `${booking.first_name} ${booking.last_name}`;
    const roomKey = booking.room_id || booking.room_name;
    // Normalizar tiempo a formato HH:mm
    const time = booking.time?.slice(0, 5) || booking.time;
    
    if (!time) continue; // Saltar si no hay tiempo

    if (!currentGroup) {
      // Iniciar nuevo grupo
      currentGroup = {
        id: booking.id,
        room_id: booking.room_id,
        room_name: booking.room_name,
        first_name: booking.first_name,
        last_name: booking.last_name,
        date: booking.date,
        startTime: time,
        endTime: getSlotEndTime(time),
        slots: [time],
        personKey,
        roomKey,
        cancel_code: booking.cancel_code
      };
    } else {
      // Verificar si es consecutivo (misma persona, misma sala, hora siguiente)
      const lastEndTime = currentGroup.endTime;
      const isConsecutive = 
        currentGroup.personKey === personKey &&
        currentGroup.roomKey === roomKey &&
        time === lastEndTime;

      if (isConsecutive) {
        // Extender el grupo actual
        currentGroup.endTime = getSlotEndTime(time);
        currentGroup.slots.push(time);
      } else {
        // Guardar grupo actual y empezar uno nuevo
        grouped.push(currentGroup);
        currentGroup = {
          id: booking.id,
          room_id: booking.room_id,
          room_name: booking.room_name,
          first_name: booking.first_name,
          last_name: booking.last_name,
          date: booking.date,
          startTime: time,
          endTime: getSlotEndTime(time),
          slots: [time],
          personKey,
          roomKey,
          cancel_code: booking.cancel_code
        };
      }
    }
  }

  // Agregar el último grupo
  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
};

