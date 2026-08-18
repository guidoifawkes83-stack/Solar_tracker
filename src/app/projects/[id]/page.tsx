import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveUsdToPhp } from "@/lib/fx";
import ProjectForm from "@/components/ProjectForm";
import { updateProject, deleteProject, addMaterialCost, deleteMaterialCost } from "../actions";
import type { Project } from "@/lib/types";
import { formatPHP } from "@/lib/margin";

export const dynamic = "force-dynamic";

async function getProject(id: string): Promise<Project | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), material_costs(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Project | null;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, fx] = await Promise.all([getProject(id), getLiveUsdToPhp()]);
  if (!project) notFound();

  const materialsActual = project.material_costs?.length
    ? project.material_costs.reduce((s, m) => s + Number(m.amount_php), 0)
    : null;

  const boundUpdate = updateProject.bind(null, project.id);
  const boundDelete = deleteProject.bind(null, project.id);
  const boundAddMaterial = addMaterialCost.bind(null, project.id);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
              ← All projects
            </Link>
            <h1 className="text-xl font-semibold mt-1">
              {project.project_name}{" "}
              <span className="text-neutral-500 font-normal">
                (PRJ-{project.project_number})
              </span>
            </h1>
          </div>
          <form action={boundDelete}>
            <button
              type="submit"
              className="text-xs text-red-400 hover:text-red-300 border border-red-900 rounded-md px-3 py-1.5"
            >
              Delete project
            </button>
          </form>
        </div>

        <ProjectForm
          action={boundUpdate}
          project={project}
          clientName={project.clients?.name}
          liveFxRate={fx.rate}
          materialsActual={materialsActual}
          submitLabel="Save changes"
        />

        <div className="border border-neutral-800 rounded-xl p-5 mt-6 max-w-md">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Add a material cost line item
          </h2>
          <form action={boundAddMaterial} className="flex gap-2">
            <input
              name="description"
              placeholder="e.g. Breaker box"
              required
              className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
            <input
              name="amount_php"
              type="number"
              step="0.01"
              placeholder="₱ amount"
              required
              className="w-32 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-2 text-sm"
            >
              Add
            </button>
          </form>
          {project.material_costs && project.material_costs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {project.material_costs.map((m) => {
                const boundDeleteMaterial = deleteMaterialCost.bind(null, project.id, m.id);
                return (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{m.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-neutral-400">
                        {formatPHP(Number(m.amount_php))}
                      </span>
                      <form action={boundDeleteMaterial}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
