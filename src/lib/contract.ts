// Generates the per-project installation & warranty contract as a .docx
// file. Kept separate from margin.ts / budget.ts on purpose — this reads
// project data but never computes money, so it can't affect either of
// those already-verified calculations.
//
// Warranty terms are deliberately generic and were confirmed with Harold:
//   - Labor: flat 1-year warranty from energisation, covers workmanship only.
//   - Materials: NOT warranted by the Installer — covered solely by
//     whatever the original supplier/manufacturer offers.
//   - After-sales support timing: because of travel distance to site,
//     response can take several business days depending on the issue.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import type { Project } from "./types";

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

function body(text: string) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text })],
  });
}

function detailRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        borders: NO_BORDER,
        width: { size: 35, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        borders: NO_BORDER,
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value })] })],
      }),
    ],
  });
}

function formatPHP(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildContractDocx(project: Project, generatedOn: string): Promise<Buffer> {
  const clientName = project.clients?.name ?? "___________________________";
  const clientAddress = project.clients?.address ?? "";
  const installerName = project.installers?.name ?? "___________________________";
  const systemSize = project.system_size_kw ? `${project.system_size_kw} kW` : "N/A";
  const energisationDate = project.target_energisation
    ? formatDate(project.target_energisation)
    : "To be confirmed";

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "SOLAR SYSTEM INSTALLATION & WARRANTY AGREEMENT",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Project PRJ-${project.project_number} — Generated ${generatedOn}`,
                italics: true,
                color: "666666",
              }),
            ],
          }),

          heading("1. Parties"),
          body(
            `This Agreement is made between the Installer, ${installerName} ("the Installer"), and the Client, ${clientName} ("the Client")${
              clientAddress ? `, of ${clientAddress}` : ""
            }, in connection with the solar power system project described below.`
          ),

          heading("2. Project Details"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              detailRow("Project name", project.project_name),
              detailRow("System size", systemSize),
              detailRow("Project type", project.project_type),
              detailRow("Amount quoted", formatPHP(Number(project.amount_quoted_php))),
              detailRow("Target energisation date", energisationDate),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),

          heading("3. Scope of Work"),
          body(
            "The Installer agrees to supply and/or install the solar power system described above at the Client's site, in accordance with the agreed specifications, the applicable quotation/invoice for this project, and standard electrical installation practice."
          ),

          heading("4. Warranty"),
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: "4.1 Labor Warranty — One (1) Year", bold: true })],
          }),
          body(
            "The Installer warrants that all labor and workmanship performed in connection with the installation of the System shall be free from defects for a period of one (1) year from the date of system energization / completion of installation (the “Labor Warranty Period”). Should any defect in workmanship arise within the Labor Warranty Period, the Installer shall repair or correct the defect at no additional labor cost to the Client. This warranty does not cover damage caused by misuse, unauthorized modification or repair by third parties, acts of God, or normal wear and tear."
          ),
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: "4.2 Materials Warranty", bold: true })],
          }),
          body(
            "All panels, inverters, batteries, and other equipment supplied as part of the System are covered solely by the original manufacturer's/supplier's warranty terms, which apply independently of this Agreement. The Installer will assist the Client, where reasonably possible, in facilitating warranty claims with the relevant supplier or manufacturer, but does not itself warrant the performance, durability, or replacement of materials beyond what the supplier provides. Copies of applicable manufacturer/supplier warranty documentation will be made available to the Client upon request."
          ),

          heading("5. System Care & Maintenance Guidelines"),
          body("To keep the System performing well and to avoid unnecessary service visits, the Client should:"),
          bullet(
            "Keep solar panels free of dust, leaves, and debris — clean periodically with water and a soft brush or cloth; avoid abrasive materials or high-pressure washing."
          ),
          bullet(
            "Ensure the inverter and battery enclosure have adequate ventilation and are not exposed to direct sunlight, moisture, or enclosed heat."
          ),
          bullet(
            "Never open, modify, or attempt to repair any electrical enclosure, wiring, or component — contact the Installer or a licensed electrician instead."
          ),
          bullet(
            "Periodically check the system's monitoring app or display for fault codes or unusual readings, and report anomalies promptly."
          ),
          bullet("Keep the breaker/disconnect panel accessible and unobstructed at all times."),
          bullet(
            "Avoid water pooling or flooding near ground-mounted equipment; ensure proper drainage around the installation."
          ),
          bullet("Schedule a professional inspection at least once a year to catch issues early."),
          bullet(
            "Immediately report unusual noises, burning smells, sparking, or a sudden drop in system performance."
          ),

          heading("6. After-Sales Support"),
          body(
            "Due to the distance between the Installer's base and the installation site, after-sales support and repair visits may take several business days to be scheduled and completed, depending on the nature and severity of the reported issue, technician and parts availability, and weather or site conditions. The Installer will make reasonable efforts to prioritize and respond promptly to safety-related concerns. Support response times do not affect the Client's rights under the Labor Warranty in Section 4.1."
          ),

          heading("7. General"),
          body(
            "This Agreement, together with the project quotation/invoice referenced above, constitutes the parties' full understanding regarding installation labor warranty and after-sales support for this System. It does not replace or modify any separate written agreement covering pricing, payment terms, or scope of work."
          ),

          heading("8. Signatures"),
          new Paragraph({ spacing: { before: 300, after: 60 }, children: [new TextRun({ text: "Installer" })] }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: "Signature: ______________________________" })],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: `Printed name: ${installerName}` })],
          }),
          new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "Date: ______________________________" })] }),

          new Paragraph({ spacing: { before: 100, after: 60 }, children: [new TextRun({ text: "Client" })] }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: "Signature: ______________________________" })],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: `Printed name: ${clientName}` })],
          }),
          new Paragraph({ children: [new TextRun({ text: "Date: ______________________________" })] }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
