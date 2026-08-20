import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildContractDocx } from "@/lib/contract";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), installers(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = data as unknown as Project;
  const generatedOn = new Date().toISOString().slice(0, 10);
  const buffer = await buildContractDocx(project, generatedOn);

  const safeName = project.project_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  const filename = `Contract-${safeName || "project"}-PRJ-${project.project_number}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
