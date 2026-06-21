"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const quickTimes = ["09:00", "12:00", "15:00", "17:00", "18:00"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatClockTime(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function normalizeClockTime(value: string) {
  const [rawHours = "17", rawMinutes = "00"] = value.split(":");
  const hours = Math.min(23, Math.max(0, Number(rawHours) || 0));
  const minutes = Math.min(59, Math.max(0, Number(rawMinutes) || 0));
  return `${pad(hours)}:${pad(minutes)}`;
}

function calendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function JobForm({
  customers,
  vehicles,
  mechanics
}: {
  customers: { id: number; fullName: string }[];
  vehicles: { id: number; licensePlate: string; make: string; model: string; customerId: number; mileage: number }[];
  mechanics: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const [completionMonth, setCompletionMonth] = useState(() => new Date());
  const [completionDate, setCompletionDate] = useState("");
  const [completionTime, setCompletionTime] = useState("17:00");
  const filteredVehicles = selectedCustomerId ? vehicles.filter((vehicle) => String(vehicle.customerId) === selectedCustomerId) : [];
  const estimatedCompletionAt = completionDate ? `${completionDate}T${completionTime || "17:00"}` : "";

  function moveCompletionMonth(direction: number) {
    setCompletionMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not create job card.");
      }
      formElement.reset();
      setSelectedCustomerId("");
      setSelectedVehicleId("");
      setVehicleMileage("");
      setCompletionDate("");
      setCompletionTime("17:00");
      setCompletionMonth(new Date());
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create job card.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <select
        name="customerId"
        required
        value={selectedCustomerId}
        onChange={(event) => {
          setSelectedCustomerId(event.target.value);
          setSelectedVehicleId("");
          setVehicleMileage("");
        }}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Customer</option>
        {customers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
      </select>
      <select
        name="vehicleId"
        required
        disabled={!selectedCustomerId}
        value={selectedVehicleId}
        onChange={(event) => {
          setSelectedVehicleId(event.target.value);
          const vehicle = vehicles.find((item) => String(item.id) === event.target.value);
          setVehicleMileage(vehicle ? String(vehicle.mileage) : "");
        }}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
      >
        <option value="">{selectedCustomerId ? "Vehicle" : "Select customer first"}</option>
        {filteredVehicles.map((item) => <option key={item.id} value={item.id}>{item.licensePlate} - {item.make} {item.model}</option>)}
      </select>
      <Input name="vehicleMileage" type="number" min="0" value={vehicleMileage} onChange={(event) => setVehicleMileage(event.target.value)} placeholder="Current vehicle kilometers" />
      <select name="assignedMechanicId" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Assigned mechanic</option>{mechanics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <Textarea name="problemDescription" placeholder="Problem description" required />
      <section className="grid gap-3 rounded-md border border-border bg-muted/30 p-3">
        <input type="hidden" name="estimatedCompletionAt" value={estimatedCompletionAt} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Estimated completion</p>
            <p className="text-xs text-muted-foreground">When do you expect the vehicle to be ready?</p>
          </div>
          <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
        </div>
        <div className="rounded-md border border-border bg-background p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button type="button" size="icon" variant="ghost" aria-label="Previous month" onClick={() => moveCompletionMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">{monthLabel(completionMonth)}</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Next month" onClick={() => moveCompletionMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays(completionMonth).map((day) => {
              const key = dateKey(day);
              const isSelected = key === completionDate;
              const isToday = key === dateKey(new Date());
              const isCurrentMonth = day.getMonth() === completionMonth.getMonth();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCompletionDate(key)}
                  className={[
                    "flex aspect-square items-center justify-center rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-ring",
                    isSelected ? "bg-primary font-semibold text-primary-foreground shadow-sm" : "hover:bg-muted",
                    !isSelected && isToday ? "border border-primary text-primary" : "",
                    isCurrentMonth ? "" : "text-muted-foreground/40"
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Time</span>
            <Input
              value={completionTime}
              onBlur={(event) => setCompletionTime(normalizeClockTime(event.target.value))}
              onChange={(event) => setCompletionTime(formatClockTime(event.target.value))}
              inputMode="numeric"
              maxLength={5}
              placeholder="17:00"
              aria-label="Estimated completion time"
              className="h-9 w-28 text-center font-semibold"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setCompletionTime(time)}
                className={[
                  "h-8 rounded-md border px-2.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-ring",
                  completionTime === time ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
                ].join(" ")}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => setCompletionDate("")} disabled={!completionDate}>
            Clear date
          </Button>
        </div>
      </section>
      <Textarea name="mechanicNotes" placeholder="Mechanic notes" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Saving..." : "Create job card"}</Button>
    </form>
  );
}
