"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const serviceOptions = [
  { key: "engine_oil", label: "Engine oil", category: "basic" },
  { key: "oil_filter", label: "Oil filter", category: "basic" },
  { key: "air_filter", label: "Air filter", category: "basic" },
  { key: "cabin_filter", label: "Cabin filter", category: "basic" },
  { key: "spark_plugs", label: "Spark plugs", category: "basic" },
  { key: "fuel_filter", label: "Fuel filter", category: "extra" },
  { key: "brake_fluid", label: "Brake fluid", category: "extra" },
  { key: "coolant", label: "Coolant", category: "extra" },
  { key: "brake_check", label: "Brake check", category: "extra" },
  { key: "front_brake_pads", label: "Front brake pads", category: "extra" },
  { key: "rear_brake_pads", label: "Rear brake pads", category: "extra" },
  { key: "brake_discs", label: "Brake discs", category: "extra" },
  { key: "battery_check", label: "Battery check", category: "extra" },
  { key: "wiper_blades", label: "Wiper blades", category: "extra" },
  { key: "lights_check", label: "Lights check", category: "extra" },
  { key: "belts_check", label: "Belts check", category: "extra" },
  { key: "suspension_check", label: "Suspension check", category: "extra" },
  { key: "wheel_alignment", label: "Wheel alignment", category: "extra" },
  { key: "ac_service", label: "A/C service", category: "extra" },
  { key: "gearbox_oil", label: "Gearbox oil", category: "extra" },
  { key: "tyre_pressure", label: "Tyre pressure", category: "extra" },
  { key: "tyre_rotation", label: "Tyre rotation", category: "extra" },
  { key: "diagnostic_scan", label: "Diagnostic scan", category: "extra" }
] as const;

const basicKeys = new Set<string>(serviceOptions.filter((item) => item.category === "basic").map((item) => item.key));

type ChecklistItem = {
  itemKey: string;
  label: string;
  category: string;
  completed: boolean;
  notes?: string | null;
};

type JobServiceChecklistProps = {
  jobId: number;
  vehicleMileage: number;
  service: {
    vehicleReceivedAt?: string | null;
    jobCardIssuedAt?: string | null;
    serviceMileage?: number | null;
    oilChangeDueMileage?: number | null;
    nextServiceDueMileage?: number | null;
  };
  items: ChecklistItem[];
};

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function JobServiceChecklist({ jobId, vehicleMileage, service, items }: JobServiceChecklistProps) {
  const router = useRouter();
  const initialItems = useMemo(() => {
    const saved = new Map(items.map((item) => [item.itemKey, item]));
    return serviceOptions
      .filter((item) => basicKeys.has(item.key) || saved.has(item.key))
      .map((item) => saved.get(item.key) ?? { itemKey: item.key, label: item.label, category: item.category, completed: false, notes: "" });
  }, [items]);
  const [selectedItems, setSelectedItems] = useState<ChecklistItem[]>(initialItems);
  const [vehicleReceivedAt, setVehicleReceivedAt] = useState(toLocalInput(service.vehicleReceivedAt));
  const [jobCardIssuedAt, setJobCardIssuedAt] = useState(toLocalInput(service.jobCardIssuedAt));
  const [serviceMileage, setServiceMileage] = useState(String(service.serviceMileage ?? vehicleMileage ?? ""));
  const [customLabel, setCustomLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mileage = Number(serviceMileage || 0);
  const oilDue = mileage > 0 ? mileage + 5000 : null;
  const nextServiceDue = mileage > 0 ? mileage + 10000 : null;
  const availableOptions = serviceOptions.filter((option) => !selectedItems.some((item) => item.itemKey === option.key));

  function updateItem(itemKey: string, patch: Partial<ChecklistItem>) {
    setSelectedItems((current) => current.map((item) => (item.itemKey === itemKey ? { ...item, ...patch } : item)));
  }

  function addCustomItem() {
    const label = customLabel.trim();
    if (!label) return;
    const baseKey = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "custom_item";
    let itemKey = `custom_${baseKey}`;
    let suffix = 2;
    while (selectedItems.some((item) => item.itemKey === itemKey)) {
      itemKey = `custom_${baseKey}_${suffix}`;
      suffix += 1;
    }
    setSelectedItems((current) => [...current, { itemKey, label, category: "custom", completed: false, notes: "" }]);
    setCustomLabel("");
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleReceivedAt,
          jobCardIssuedAt,
          serviceMileage,
          items: selectedItems
        })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not save service checklist.");
      }
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save service checklist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Vehicle entered</label>
          <Input type="datetime-local" value={vehicleReceivedAt} onChange={(event) => setVehicleReceivedAt(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Job card issued</label>
          <Input type="datetime-local" value={jobCardIssuedAt} onChange={(event) => setJobCardIssuedAt(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Service mileage</label>
          <Input type="number" value={serviceMileage} onChange={(event) => setServiceMileage(event.target.value)} placeholder="Mileage now" />
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Oil change due</p>
          <p className="text-lg font-semibold">{oilDue ? `${oilDue.toLocaleString()} km` : "-"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Next service due</p>
          <p className="text-lg font-semibold">{nextServiceDue ? `${nextServiceDue.toLocaleString()} km` : "-"}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <div>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
            onChange={(event) => {
              const option = serviceOptions.find((item) => item.key === event.target.value);
              if (option) setSelectedItems((current) => [...current, { itemKey: option.key, label: option.label, category: option.category, completed: false, notes: "" }]);
              event.currentTarget.value = "";
            }}
          >
            <option value="">Add basic / extra checklist item</option>
            <optgroup label="Basic">
              {availableOptions.filter((item) => item.category === "basic").map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
            <optgroup label="Extra add-ons">
              {availableOptions.filter((item) => item.category === "extra").map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomItem();
              }
            }}
            placeholder="Custom checklist item"
          />
          <Button type="button" variant="secondary" onClick={addCustomItem}>
            <Plus className="h-4 w-4" />
            Add custom
          </Button>
        </div>

        <div className="grid gap-2">
          {selectedItems.map((item) => (
            <div key={item.itemKey} className="grid gap-2 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={item.completed} onChange={(event) => updateItem(item.itemKey, { completed: event.target.checked })} />
                  <span>{item.label}</span>
                  <span className="text-xs uppercase text-muted-foreground">{item.category}</span>
                </label>
                {!basicKeys.has(item.itemKey) ? (
                  <Button type="button" size="icon" variant="ghost" onClick={() => setSelectedItems((current) => current.filter((currentItem) => currentItem.itemKey !== item.itemKey))}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <Textarea className="min-h-16" placeholder="Note for this item" value={item.notes ?? ""} onChange={(event) => updateItem(item.itemKey, { notes: event.target.value })} />
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" onClick={save} disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save service checklist"}
      </Button>
    </div>
  );
}
