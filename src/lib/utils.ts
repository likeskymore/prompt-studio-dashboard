import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addThousandsSeparator(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function numberToPercentage(num: number) {
  return `${num * 100}%`;
}

export function pickStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const text = record.message ?? record.text ?? record.event;

        if (typeof text === "string") {
          return text;
        }
      }

      return "";
    })
    .filter((item) => item.length > 0);
}

export function formatNumber(
  value: number | undefined,
  fractionDigits = 0,
): string {
  if (value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatDate(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatElapsedTime(
  start: string | undefined,
  end?: string | undefined,
): string {
  if (!start) {
    return "--";
  }

  const startTime = new Date(start).getTime();
  const finishTime = end ? new Date(end).getTime() : Date.now();

  if (Number.isNaN(startTime) || Number.isNaN(finishTime)) {
    return "--";
  }

  const totalSeconds = Math.max(0, Math.floor((finishTime - startTime) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function calculateActiveElapsedSeconds(
  start?: string,
  end?: string,
  totalPausedMs = 0,
  pausedAt?: string,
): number {
  if (!start) return 0;

  const startTime = new Date(start).getTime();
  const endTime = end === undefined ? Date.now() : new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  const elapsedMs = Math.max(0, endTime - startTime);
  const accumulatedPausedMs = Number(totalPausedMs);
  let pausedMs = Number.isFinite(accumulatedPausedMs)
    ? Math.max(0, accumulatedPausedMs)
    : 0;

  if (pausedAt) {
    const currentPauseStart = new Date(pausedAt).getTime();

    if (Number.isFinite(currentPauseStart) && currentPauseStart < endTime) {
      pausedMs += Math.max(0, endTime - Math.max(startTime, currentPauseStart));
    }
  }

  return Math.max(0, (elapsedMs - pausedMs) / 1000);
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return "--";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}
