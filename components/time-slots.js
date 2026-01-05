"use client";

import { memo } from "react";
import { Chip, Tooltip } from "@mui/material";
import clsx from "clsx";
import { formatTime12h } from "@/lib/time";

const statusCopy = {
  available: "Disponible",
  reserved: "Reservada",
  invalid: "No disponible"
};

const statusChipColor = {
  available: "success",
  reserved: "error",
  invalid: "default"
};

const statusBgClasses = {
  available: "bg-white dark:bg-slate-700/80 border-brand/50 dark:border-brand/60 hover:border-brand dark:hover:border-brand/80 text-slate-900 dark:text-slate-100",
  reserved: "bg-rose-50 dark:bg-rose-900/40 border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300",
  invalid: "bg-slate-100 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
};

function TimeSlots({
  slots = [],
  slotStates = [],
  selectedSlots = [],
  onToggle
}) {
  const stateMap = slotStates.reduce((acc, slot) => {
    acc[slot.time] = slot;
    return acc;
  }, {});

  const groupedSlots = slots.reduce((groups, slot) => {
    const [hour] = slot.split(":");
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(slot);
    return groups;
  }, {});

  const hourLabel = (hour) => {
    const startHour = hour.padStart(2, "0");
    const endHour = String((parseInt(hour, 10) + 1) % 24).padStart(2, "0");
    return `${formatTime12h(`${startHour}:00`)} – ${formatTime12h(`${endHour}:00`)}`;
  };

  const hourKeys = Object.keys(groupedSlots).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-center sm:text-left w-full sm:w-auto">
          Horarios disponibles 7:00 a. m. - 8:00 p. m.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300 justify-center sm:justify-end w-full sm:w-auto">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand dark:bg-brand-light"></span> Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400"></span> Reservado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></span> Pasado
          </span>
        </div>
      </div>
      <div className="max-h-[600px] md:max-h-[520px] space-y-4 overflow-y-auto pr-1 custom-scrollbar">
        {hourKeys.map((hour) => (
          <div
            key={hour}
            className="rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-gradient-to-br from-white to-slate-50 dark:from-slate-700/80 dark:to-slate-800/80 p-4 shadow-lg md:rounded-2xl hover:shadow-xl transition-all duration-200"
          >
            <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-600">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {hourLabel(hour)}
              </p>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-600/50 px-2 py-0.5 rounded-full">
                {groupedSlots[hour].length} bloques
              </span>
            </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {groupedSlots[hour].map((slot) => {
                const slotInfo = stateMap[slot] || { status: "available" };
                const label =
                  slotInfo.status === "reserved"
                    ? `${slotInfo.booking?.first_name} ${slotInfo.booking?.last_name}`
                    : statusCopy[slotInfo.status];
                const isSelected = selectedSlots.includes(slot);

                const button = (
                  <button
                    key={slot}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (slotInfo.status === "available") {
                        onToggle?.(slot);
                      }
                    }}
                    disabled={slotInfo.status !== "available"}
                    aria-label={
                      slotInfo.status === "reserved"
                        ? `Horario ${slot} reservado por ${slotInfo.booking?.first_name} ${slotInfo.booking?.last_name}`
                        : slotInfo.status === "invalid"
                          ? `Horario ${slot} no disponible`
                          : isSelected
                            ? `Horario ${slot} seleccionado`
                            : `Seleccionar horario ${slot}`
                    }
                    aria-pressed={isSelected}
                    className={clsx(
                      "group relative flex h-20 sm:h-18 w-full flex-col items-start justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-95 touch-manipulation",
                      "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                      statusBgClasses[slotInfo.status],
                      {
                        "shadow-lg shadow-brand/30 bg-gradient-to-br from-brand to-brand-dark text-white border-transparent ring-2 ring-brand/50":
                          isSelected
                      },
                      {
                        "opacity-60 cursor-not-allowed": slotInfo.status !== "available"
                      },
                      {
                        "hover:scale-105 hover:shadow-md cursor-pointer": slotInfo.status === "available" && !isSelected
                      }
                    )}
                  >
                    <span className="text-base sm:text-sm font-bold tracking-tight">
                      {formatTime12h(slot)}
                    </span>
                    <div className="flex w-full items-center justify-between gap-1">
                      <Chip
                        size="small"
                        color={
                          isSelected ? "default" : statusChipColor[slotInfo.status]
                        }
                        label={slotInfo.status === "reserved" ? "Ocupado" : label}
                        className={clsx("text-[10px] uppercase font-medium", {
                          "bg-white/20 text-white": isSelected
                        })}
                      />
                      {slotInfo.booking && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-300 group-disabled:text-rose-400 dark:group-disabled:text-rose-300 truncate max-w-[60px]">
                          {slotInfo.booking.first_name}
                        </span>
                      )}
                    </div>
                  </button>
                );

                return (
                  <Tooltip
                    key={slot}
                    title={
                      slotInfo.booking
                        ? `${label} (${slot})`
                        : statusCopy[slotInfo.status]
                    }
                    disableInteractive={slotInfo.status === "available"}
                  >
                    {slotInfo.status !== "available" ? (
                      <span style={{ display: "inline-block", width: "100%" }}>
                        {button}
                      </span>
                    ) : (
                      button
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TimeSlots);

