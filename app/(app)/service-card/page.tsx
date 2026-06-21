import { ServiceCardForm } from "@/components/service-card-form";

export default function ServiceCardPage() {
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-bold">Service Card</h1>
        <p className="text-sm text-muted-foreground">Create a printable oil change and service reminder card.</p>
      </header>
      <ServiceCardForm />
    </div>
  );
}
