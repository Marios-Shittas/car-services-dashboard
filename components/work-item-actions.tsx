"use client";

import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WorkItemActions({ id, completed }: { id: number; completed: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function setCompleted(nextCompleted: boolean) {
    setSaving(true);
    try {
      const response = await fetch(`/api/work/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted })
      });
      if (!response.ok) throw new Error("Could not update work.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteWork() {
    if (!confirm("Delete this work item?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/work/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete work.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant={completed ? "secondary" : "primary"} disabled={saving} onClick={() => setCompleted(!completed)}>
        {completed ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        {completed ? "Reopen" : "Complete"}
      </Button>
      <Button size="sm" variant="danger" disabled={saving} onClick={deleteWork} aria-label="Delete work">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
