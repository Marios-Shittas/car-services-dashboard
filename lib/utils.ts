import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function eur(value: number | string | { toString(): string } | null | undefined) {
  if (value === null || value === undefined) return "€0.00";
  return new Intl.NumberFormat("en-CY", { style: "currency", currency: "EUR" }).format(Number(value));
}

export function cyDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy");
}

export function cyDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

export function jobStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
