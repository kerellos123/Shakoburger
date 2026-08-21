import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, UnauthorizedError } from "@/lib/requireAdmin";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

interface MemberStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const period = request.nextUrl.searchParams.get("period") ?? new Date().toISOString().slice(0, 7);
    const format = request.nextUrl.searchParams.get("format") ?? "xlsx";

    const reportDoc = await adminDb.collection("reportsCache").doc(period).get();
    if (!reportDoc.exists) {
      return NextResponse.json({ error: `No report cached for ${period} yet.` }, { status: 404 });
    }

    const report = reportDoc.data() as { totalMeetings: number; avgAttendancePercent: number; byMember: Record<string, MemberStats> };

    // Resolve member names for a readable export.
    const memberIds = Object.keys(report.byMember);
    const names: Record<string, string> = {};
    await Promise.all(
      memberIds.map(async (uid) => {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        names[uid] = userDoc.data()?.fullName ?? uid;
      })
    );

    if (format === "pdf") {
      return exportPdf(period, report, names);
    }
    return exportXlsx(period, report, names);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

async function exportXlsx(
  period: string,
  report: { totalMeetings: number; avgAttendancePercent: number; byMember: Record<string, MemberStats> },
  names: Record<string, string>
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Attendance ${period}`);

  sheet.addRow(["Member", "Present", "Absent", "Excused", "Late"]);
  sheet.getRow(1).font = { bold: true };

  for (const [uid, stats] of Object.entries(report.byMember)) {
    sheet.addRow([names[uid] ?? uid, stats.present, stats.absent, stats.excused, stats.late]);
  }

  sheet.addRow([]);
  sheet.addRow(["Total meetings", report.totalMeetings]);
  sheet.addRow(["Average attendance %", report.avgAttendancePercent.toFixed(1)]);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${period}.xlsx"`,
    },
  });
}

function exportPdf(
  period: string,
  report: { totalMeetings: number; avgAttendancePercent: number; byMember: Record<string, MemberStats> },
  names: Record<string, string>
): Promise<NextResponse> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="attendance-${period}.pdf"`,
          },
        })
      );
    });

    doc.fontSize(18).text(`Attendance Report — ${period}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Total meetings: ${report.totalMeetings}`);
    doc.text(`Average attendance: ${report.avgAttendancePercent.toFixed(1)}%`);
    doc.moveDown();

    doc.fontSize(11).text("Member".padEnd(30) + "Present  Absent  Excused  Late");
    doc.moveDown(0.5);

    for (const [uid, stats] of Object.entries(report.byMember)) {
      const name = (names[uid] ?? uid).padEnd(30);
      doc.text(`${name}${stats.present}        ${stats.absent}       ${stats.excused}        ${stats.late}`);
    }

    doc.end();
  });
}
