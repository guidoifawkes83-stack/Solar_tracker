import ProjectForm from "@/components/ProjectForm";
import { createProject } from "../actions";
import { getLiveUsdToPhp } from "@/lib/fx";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const fx = await getLiveUsdToPhp();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">New Project</h1>
        <ProjectForm action={createProject} liveFxRate={fx.rate} submitLabel="Create project" />
      </div>
    </div>
  );
}
