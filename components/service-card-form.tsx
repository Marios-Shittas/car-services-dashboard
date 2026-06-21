"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Car, Download, Gauge, Printer, User } from "lucide-react";
import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ServiceCardData = {
  garageName: string;
  customerName: string;
  vehicleName: string;
  serviceDate: string;
  currentMileage: string;
  nextOilChangeMileage: string;
  secondOilChangeMileage: string;
  nextServiceMileage: string;
};

function formatMileage(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

function displayDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function withKm(value: string) {
  return value ? `${value} km` : "-";
}

function getFormData(form: HTMLFormElement): ServiceCardData {
  const formData = new FormData(form);
  return {
    garageName: String(formData.get("garageName") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    vehicleName: String(formData.get("vehicleName") ?? ""),
    serviceDate: String(formData.get("serviceDate") ?? ""),
    currentMileage: String(formData.get("currentMileage") ?? ""),
    nextOilChangeMileage: String(formData.get("nextOilChangeMileage") ?? ""),
    secondOilChangeMileage: String(formData.get("secondOilChangeMileage") ?? ""),
    nextServiceMileage: String(formData.get("nextServiceMileage") ?? "")
  };
}

const pdfStyles = StyleSheet.create({
  page: { padding: 4, fontSize: 4.6, fontFamily: "Helvetica" },
  card: { border: "0.75 solid #111827", borderRadius: 4, padding: 5 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #0f766e", paddingBottom: 3, marginBottom: 3 },
  title: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  subtitle: { marginTop: 1, color: "#0f766e", fontSize: 5.5 },
  garage: { fontSize: 5.5, fontFamily: "Helvetica-Bold", color: "#0f766e", textAlign: "right" },
  columns: { flexDirection: "row", gap: 5 },
  column: { flex: 1 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb", paddingVertical: 1.2 },
  label: { width: 44, fontFamily: "Helvetica-Bold" },
  value: { flex: 1 },
  box: { border: "0.75 solid #0f766e", borderRadius: 3, marginBottom: 3, overflow: "hidden" },
  boxTitle: { backgroundColor: "#0f766e", color: "white", padding: 2, fontFamily: "Helvetica-Bold", fontSize: 5.8 },
  boxBody: { paddingHorizontal: 3, paddingVertical: 1.5 },
  footer: { borderTop: "0.75 solid #111827", marginTop: 3, paddingTop: 3, flexDirection: "row", justifyContent: "space-between" }
});

function ServiceCardPdf({ data }: { data: ServiceCardData }) {
  return (
    <Document>
      <Page size={[241, 156]} style={pdfStyles.page}>
        <View style={pdfStyles.card}>
          <View style={pdfStyles.header}>
            <View>
              <Text style={pdfStyles.title}>AUTO SERVICE REMINDER</Text>
              <Text style={pdfStyles.subtitle}>Oil Change & Service Card</Text>
            </View>
            <Text style={pdfStyles.garage}>{data.garageName || "Garage"}</Text>
          </View>
          <View style={pdfStyles.columns}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}><Text style={pdfStyles.label}>Customer:</Text><Text style={pdfStyles.value}>{data.customerName}</Text></View>
              <View style={pdfStyles.row}><Text style={pdfStyles.label}>Vehicle:</Text><Text style={pdfStyles.value}>{data.vehicleName}</Text></View>
              <View style={pdfStyles.row}><Text style={pdfStyles.label}>Service date:</Text><Text style={pdfStyles.value}>{displayDate(data.serviceDate)}</Text></View>
              <View style={pdfStyles.row}><Text style={pdfStyles.label}>Kilometers:</Text><Text style={pdfStyles.value}>{withKm(data.currentMileage)}</Text></View>
            </View>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.box}>
                <Text style={pdfStyles.boxTitle}>NEXT OIL CHANGE</Text>
                <View style={pdfStyles.boxBody}>
                  <View style={pdfStyles.row}><Text style={pdfStyles.label}>Kilometers:</Text><Text style={pdfStyles.value}>{withKm(data.nextOilChangeMileage)}</Text></View>
                </View>
              </View>
              {data.secondOilChangeMileage ? (
                <View style={pdfStyles.box}>
                  <Text style={pdfStyles.boxTitle}>2ND OIL CHANGE</Text>
                  <View style={pdfStyles.boxBody}>
                    <View style={pdfStyles.row}><Text style={pdfStyles.label}>Kilometers:</Text><Text style={pdfStyles.value}>{withKm(data.secondOilChangeMileage)}</Text></View>
                  </View>
                </View>
              ) : null}
              {data.nextServiceMileage ? (
                <View style={pdfStyles.box}>
                  <Text style={pdfStyles.boxTitle}>NEXT SERVICE</Text>
                  <View style={pdfStyles.boxBody}>
                    <View style={pdfStyles.row}><Text style={pdfStyles.label}>Kilometers:</Text><Text style={pdfStyles.value}>{withKm(data.nextServiceMileage)}</Text></View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          <View style={pdfStyles.footer}>
            <Text>Please return for service on time to keep your vehicle in good condition.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[28px_120px_minmax(0,1fr)] items-start gap-2 border-b border-dashed border-slate-300 py-2 text-sm last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <span className="font-semibold">{label}</span>
      <span className="min-w-0">{value || "-"}</span>
    </div>
  );
}

function ReminderBox({ title, mileage }: { title: string; mileage: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary/70 bg-white">
      <div className="bg-primary px-3 py-2 text-sm font-bold uppercase text-primary-foreground">{title}</div>
      <div className="grid gap-1 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">Kilometers:</span>
          <span className="font-bold text-primary">{withKm(mileage)}</span>
        </div>
      </div>
    </div>
  );
}

function ServiceCardPreview({ data }: { data: ServiceCardData }) {
  return (
    <div className="service-card-preview rounded-xl border border-slate-900 bg-white p-4 text-slate-950 shadow-sm">
      <div className="grid gap-3 border-b-2 border-primary pb-3 md:grid-cols-[1fr_1.6fr] md:items-end">
        <div>
          <p className="text-lg font-black uppercase tracking-wide text-primary">{data.garageName || "Garage"}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Oil Change & Service Card</p>
        </div>
        <div className="text-left md:text-right">
          <h2 className="text-2xl font-black uppercase tracking-wide sm:text-3xl">Auto Service Reminder</h2>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <DetailRow icon={User} label="Customer:" value={data.customerName} />
          <DetailRow icon={Car} label="Vehicle:" value={data.vehicleName} />
          <DetailRow icon={CalendarDays} label="Service date:" value={displayDate(data.serviceDate)} />
          <DetailRow icon={Gauge} label="Kilometers:" value={withKm(data.currentMileage)} />
        </div>
        <div className="grid content-start gap-3">
          <ReminderBox title="Next oil change" mileage={data.nextOilChangeMileage} />
          {data.secondOilChangeMileage ? <ReminderBox title="2nd oil change" mileage={data.secondOilChangeMileage} /> : null}
          {data.nextServiceMileage ? <ReminderBox title="Next service" mileage={data.nextServiceMileage} /> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-900 pt-3 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between">
        <span>Please return for service on time to keep your vehicle in good condition.</span>
      </div>
    </div>
  );
}

function PrintReminder({ title, mileage }: { title: string; mileage: string }) {
  if (!mileage) return null;
  return (
    <div className="print-reminder">
      <span>{title}</span>
      <strong>{withKm(mileage)}</strong>
    </div>
  );
}

function ServiceCardPrint({ data }: { data: ServiceCardData }) {
  return (
    <div className="service-card-print-card">
      <div className="print-head">
        <div>
          <strong>{data.garageName || "Garage"}</strong>
          <span>Oil Change & Service Card</span>
        </div>
        <h2>Service Reminder</h2>
      </div>
      <div className="print-body">
        <div className="print-details">
          <p><span>Customer</span><strong>{data.customerName}</strong></p>
          <p><span>Vehicle</span><strong>{data.vehicleName}</strong></p>
          <p><span>Service date</span><strong>{displayDate(data.serviceDate)}</strong></p>
          <p><span>Current km</span><strong>{withKm(data.currentMileage)}</strong></p>
        </div>
        <div className="print-reminders">
          <PrintReminder title="Next oil" mileage={data.nextOilChangeMileage} />
          <PrintReminder title="2nd oil" mileage={data.secondOilChangeMileage} />
          <PrintReminder title="Service" mileage={data.nextServiceMileage} />
        </div>
      </div>
      <div className="print-foot">Please return for service on time.</div>
    </div>
  );
}

export function ServiceCardForm() {
  const [card, setCard] = useState<ServiceCardData | null>(null);
  const [currentMileage, setCurrentMileage] = useState("");
  const [nextOilMileage, setNextOilMileage] = useState("");
  const [secondOilMileage, setSecondOilMileage] = useState("");
  const [nextServiceMileage, setNextServiceMileage] = useState("");

  const pdfFileName = useMemo(() => {
    const name = card?.customerName.trim().replace(/\s+/g, "-").toLowerCase() || "service-card";
    return `${name}-service-card.pdf`;
  }, [card]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCard(getFormData(event.currentTarget));
  }

  function printCard() {
    window.print();
  }

  return (
    <div className="service-card-page grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="no-print">
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input name="garageName" placeholder="Garage name (optional)" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Input name="customerName" placeholder="Customer name" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Input name="vehicleName" placeholder="Vehicle name/model" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Input name="serviceDate" type="date" required />
              <div className="relative">
                <Input name="currentMileage" value={currentMileage} onChange={(event) => setCurrentMileage(formatMileage(event.target.value))} inputMode="numeric" placeholder="Current kilometers" required className="pr-12" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="relative">
                <Input name="nextOilChangeMileage" value={nextOilMileage} onChange={(event) => setNextOilMileage(formatMileage(event.target.value))} inputMode="numeric" placeholder="Next oil change kilometers" required className="pr-12" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="relative">
                <Input name="secondOilChangeMileage" value={secondOilMileage} onChange={(event) => setSecondOilMileage(formatMileage(event.target.value))} inputMode="numeric" placeholder="2nd oil change kilometers (optional)" className="pr-12" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="relative">
                <Input name="nextServiceMileage" value={nextServiceMileage} onChange={(event) => setNextServiceMileage(formatMileage(event.target.value))} inputMode="numeric" placeholder="Next service kilometers (optional)" className="pr-12" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
              </div>
            </div>
            <Button>Generate Card</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <div className="no-print flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{card ? "Preview ready" : "Generate a card to preview and print."}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={printCard} disabled={!card}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {card ? (
              <PDFDownloadLink document={<ServiceCardPdf data={card} />} fileName={pdfFileName}>
                {({ loading }) => (
                  <Button type="button" disabled={loading}>
                    <Download className="h-4 w-4" />
                    {loading ? "Preparing..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            ) : (
              <Button type="button" disabled>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
        <div className="service-card-print-area">
          {card ? (
            <>
              <ServiceCardPreview data={card} />
              <ServiceCardPrint data={card} />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">Your service reminder card will appear here.</div>
          )}
        </div>
      </div>
      <style jsx global>{`
        .service-card-print-card {
          display: none;
        }

        @media print {
          @page {
            size: 85mm 55mm;
            margin: 0;
          }

          html,
          body {
            width: 85mm !important;
            height: 55mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          .service-card-page {
            display: block !important;
            width: 85mm !important;
            height: 55mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          .service-card-page .no-print {
            display: none !important;
          }

          .service-card-print-area,
          .service-card-print-area * {
            visibility: visible !important;
          }

          .service-card-print-area {
            display: block !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 85mm !important;
            height: 55mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          .service-card-print-area > * {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .service-card-preview {
            display: none !important;
          }

          .service-card-print-card {
            display: flex !important;
            flex-direction: column !important;
            width: 85mm !important;
            height: 55mm !important;
            max-width: 85mm !important;
            max-height: 55mm !important;
            margin: 0 !important;
            padding: 2.2mm !important;
            overflow: hidden !important;
            border: 0.35mm solid #111827 !important;
            border-radius: 2mm !important;
            background: white !important;
            color: #0f172a !important;
            font-family: Arial, Helvetica, sans-serif !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-head {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 2mm !important;
            align-items: end !important;
            border-bottom: 0.7mm solid #0f766e !important;
            padding-bottom: 1.4mm !important;
          }

          .print-head strong {
            display: block !important;
            color: #0f766e !important;
            font-size: 7pt !important;
            line-height: 1 !important;
            text-transform: uppercase !important;
          }

          .print-head span {
            display: block !important;
            font-size: 5.2pt !important;
            font-weight: 700 !important;
            letter-spacing: 0.5pt !important;
            line-height: 1.05 !important;
            text-transform: uppercase !important;
          }

          .print-head h2 {
            margin: 0 !important;
            font-size: 10pt !important;
            line-height: 1 !important;
            text-transform: uppercase !important;
            white-space: nowrap !important;
          }

          .print-body {
            display: grid !important;
            grid-template-columns: 1fr 0.9fr !important;
            gap: 2mm !important;
            min-height: 0 !important;
            padding-top: 1.6mm !important;
            flex: 1 !important;
          }

          .print-details {
            display: grid !important;
            align-content: start !important;
            gap: 0.9mm !important;
            min-width: 0 !important;
          }

          .print-details p {
            display: grid !important;
            grid-template-columns: 19mm minmax(0, 1fr) !important;
            gap: 1mm !important;
            margin: 0 !important;
            padding-bottom: 0.8mm !important;
            border-bottom: 0.25mm dashed #cbd5e1 !important;
            font-size: 5.7pt !important;
            line-height: 1.05 !important;
          }

          .print-details span {
            font-size: 5.7pt !important;
            font-weight: 700 !important;
          }

          .print-details strong {
            min-width: 0 !important;
            font-size: 5.7pt !important;
            line-height: 1.05 !important;
            overflow-wrap: anywhere !important;
          }

          .print-reminders {
            display: grid !important;
            align-content: start !important;
            gap: 1mm !important;
          }

          .print-reminder {
            display: grid !important;
            gap: 1mm !important;
            border: 0.3mm solid #0f766e !important;
            border-radius: 1.4mm !important;
            overflow: hidden !important;
          }

          .print-reminder span {
            display: block !important;
            background: #0f766e !important;
            color: white !important;
            padding: 0.7mm 1mm !important;
            font-size: 5.2pt !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            text-transform: uppercase !important;
          }

          .print-reminder strong {
            display: block !important;
            padding: 0 1mm 0.9mm !important;
            color: #0f766e !important;
            font-size: 6pt !important;
            line-height: 1 !important;
            text-align: right !important;
          }

          .print-foot {
            border-top: 0.25mm solid #111827 !important;
            padding-top: 0.8mm !important;
            font-size: 5pt !important;
            font-weight: 700 !important;
            line-height: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
