"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VehicleDraft = {
  id: string;
  licensePlate: string;
  vinNumber: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  engineType: string;
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG" | "OTHER";
  color: string;
  notes: string;
};

const fieldClassName = "h-11 rounded-lg border-border/70 bg-card shadow-sm focus:border-primary focus:ring-primary/20";
const textareaClassName = "rounded-lg border-border/70 bg-card shadow-sm focus:border-primary focus:ring-primary/20";
const hintClassName = "rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive";

function emptyVehicle(): VehicleDraft {
  return {
    id: crypto.randomUUID(),
    licensePlate: "",
    vinNumber: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    engineType: "",
    fuelType: "PETROL",
    color: "",
    notes: ""
  };
}

function mileageDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatMileage(value: string) {
  const digits = mileageDigits(value);
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export function CustomerForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carsOpen, setCarsOpen] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneReady = phoneDigits.length >= 8;
  const emailReady = !email || email.includes("@");
  const fullNameError = fullName.trim().length < 2 ? "Add the customer's full name." : null;
  const phoneError = !phone ? "Add a phone number." : !phoneReady ? `${Math.max(0, 8 - phoneDigits.length)} more digit${8 - phoneDigits.length === 1 ? "" : "s"} needed.` : null;
  const emailError = emailReady ? null : "Email must include @.";

  function shouldShow(field: string) {
    return submitted || touched[field];
  }

  function touch(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function vehicleFieldError(vehicle: VehicleDraft, field: "licensePlate" | "make" | "model") {
    if (field === "licensePlate" && !vehicle.licensePlate.trim()) return "Add the license plate.";
    if (field === "make" && !vehicle.make.trim()) return "Add the brand.";
    if (field === "model" && !vehicle.model.trim()) return "Add the model.";
    return null;
  }

  function updateVehicle(id: string, patch: Partial<VehicleDraft>) {
    setVehicles((current) => current.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...patch } : vehicle)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const formElement = event.currentTarget;
    const vehicleErrors = vehicles.flatMap((vehicle) => [vehicleFieldError(vehicle, "licensePlate"), vehicleFieldError(vehicle, "make"), vehicleFieldError(vehicle, "model")]).filter(Boolean);
    if (fullNameError || phoneError || emailError || vehicleErrors.length) {
      setError("Please check the highlighted fields.");
      return;
    }

    const form = Object.fromEntries(new FormData(formElement));
    const payload = {
      ...form,
      vehicles: vehicles.map((vehicle) => ({
        licensePlate: vehicle.licensePlate,
        vinNumber: vehicle.vinNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: mileageDigits(vehicle.mileage),
        engineType: vehicle.engineType,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        notes: vehicle.notes
      })).filter((vehicle) => Object.values(vehicle).some(Boolean))
    };

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not create customer.");
      }
      formElement.reset();
      setVehicles([]);
      setCarsOpen(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setSubmitted(false);
      setTouched({});
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <section className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Input
              name="fullName"
              value={fullName}
              onBlur={() => touch("fullName")}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
              aria-invalid={shouldShow("fullName") && Boolean(fullNameError)}
              className={fieldClassName}
            />
            {shouldShow("fullName") && fullNameError ? <p className={hintClassName}>{fullNameError}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Input
              name="phone"
              value={phone}
              onBlur={() => touch("phone")}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
              inputMode="tel"
              pattern="(?:.*\d){8,}.*"
              title="Phone number must include at least 8 digits."
              required
              aria-invalid={shouldShow("phone") && Boolean(phoneError)}
              className={fieldClassName}
            />
            {shouldShow("phone") && phoneError ? <p className={hintClassName}>{phoneError}</p> : phone && phoneReady ? <p className="text-xs font-medium text-emerald-600">Phone number looks good.</p> : null}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Input name="email" value={email} onBlur={() => touch("email")} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" aria-invalid={shouldShow("email") && Boolean(emailError)} className={fieldClassName} />
          {shouldShow("email") && emailError ? <p className={hintClassName}>{emailError}</p> : email && emailReady ? <p className="text-xs font-medium text-emerald-600">Email format includes @.</p> : null}
        </div>
        <Input name="address" placeholder="Address" className={fieldClassName} />
        <Input name="vatNumber" placeholder="VAT number (optional)" className={fieldClassName} />
        <Textarea name="notes" placeholder="Customer notes" className={textareaClassName} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 p-3 text-left"
          onClick={() => {
            setCarsOpen((current) => !current);
            if (!carsOpen && vehicles.length === 0) setVehicles([emptyVehicle()]);
          }}
        >
          <span className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span>
              <span className="block text-sm font-semibold">Cars</span>
              <span className="block text-xs text-muted-foreground">{vehicles.length ? `${vehicles.length} car${vehicles.length === 1 ? "" : "s"} added` : "Optional, expandable section"}</span>
            </span>
          </span>
          {carsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {carsOpen ? (
          <div className="grid gap-3 border-t border-border p-3">
            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="grid gap-3 rounded-lg border border-border/70 bg-background p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Car {index + 1}</p>
                  {vehicles.length > 1 ? (
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove car" onClick={() => setVehicles((current) => current.filter((item) => item.id !== vehicle.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Input
                      value={vehicle.licensePlate}
                      onBlur={() => touch(`${vehicle.id}:licensePlate`)}
                      onChange={(event) => updateVehicle(vehicle.id, { licensePlate: event.target.value })}
                      placeholder="License plate"
                      required
                      aria-invalid={shouldShow(`${vehicle.id}:licensePlate`) && Boolean(vehicleFieldError(vehicle, "licensePlate"))}
                    />
                    {shouldShow(`${vehicle.id}:licensePlate`) && vehicleFieldError(vehicle, "licensePlate") ? <p className={hintClassName}>{vehicleFieldError(vehicle, "licensePlate")}</p> : null}
                  </div>
                  <Input value={vehicle.vinNumber} onChange={(event) => updateVehicle(vehicle.id, { vinNumber: event.target.value })} placeholder="VIN number" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Input
                      value={vehicle.make}
                      onBlur={() => touch(`${vehicle.id}:make`)}
                      onChange={(event) => updateVehicle(vehicle.id, { make: event.target.value })}
                      placeholder="Brand"
                      required
                      aria-invalid={shouldShow(`${vehicle.id}:make`) && Boolean(vehicleFieldError(vehicle, "make"))}
                    />
                    {shouldShow(`${vehicle.id}:make`) && vehicleFieldError(vehicle, "make") ? <p className={hintClassName}>{vehicleFieldError(vehicle, "make")}</p> : null}
                  </div>
                  <div className="grid gap-1.5">
                    <Input
                      value={vehicle.model}
                      onBlur={() => touch(`${vehicle.id}:model`)}
                      onChange={(event) => updateVehicle(vehicle.id, { model: event.target.value })}
                      placeholder="Model"
                      required
                      aria-invalid={shouldShow(`${vehicle.id}:model`) && Boolean(vehicleFieldError(vehicle, "model"))}
                    />
                    {shouldShow(`${vehicle.id}:model`) && vehicleFieldError(vehicle, "model") ? <p className={hintClassName}>{vehicleFieldError(vehicle, "model")}</p> : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.year} onChange={(event) => updateVehicle(vehicle.id, { year: event.target.value })} type="number" placeholder="Year" />
                  <div className="relative">
                    <Input value={vehicle.mileage} onChange={(event) => updateVehicle(vehicle.id, { mileage: formatMileage(event.target.value) })} inputMode="numeric" pattern="[0-9,]*" placeholder="Kilometers" className="pr-12" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.engineType} onChange={(event) => updateVehicle(vehicle.id, { engineType: event.target.value })} placeholder="Engine type" />
                  <Input value={vehicle.color} onChange={(event) => updateVehicle(vehicle.id, { color: event.target.value })} placeholder="Color" />
                </div>
                <select value={vehicle.fuelType} onChange={(event) => updateVehicle(vehicle.id, { fuelType: event.target.value as VehicleDraft["fuelType"] })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"].map((fuel) => <option key={fuel}>{fuel}</option>)}
                </select>
                <Textarea value={vehicle.notes} onChange={(event) => updateVehicle(vehicle.id, { notes: event.target.value })} placeholder="Notes" />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setVehicles((current) => [...current, emptyVehicle()])}>
              <Plus className="h-4 w-4" />
              Add another car
            </Button>
          </div>
        ) : null}
      </section>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Saving..." : "Create customer"}</Button>
    </form>
  );
}
