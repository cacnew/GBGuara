import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function BeltsPage() {
  const supabase = await createClient();

  const { data: beltSystems } = await supabase
    .from("belt_systems")
    .select("id, name, audience, modalities(name)")
    .order("name");

  const { data: belts } = await supabase
    .from("belts")
    .select("id, belt_system_id, name, color_hex, ordering, max_degrees")
    .order("ordering");

  const beltsBySystem = new Map<string, typeof belts>();
  belts?.forEach((belt) => {
    const list = beltsBySystem.get(belt.belt_system_id) ?? [];
    list.push(belt);
    beltsBySystem.set(belt.belt_system_id, list);
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Faixas e graduações
        </h1>
        <Link href="/belts/systems/new" className={buttonVariants()}>
          Novo sistema de faixa
        </Link>
      </div>

      {beltSystems?.map((system) => (
        <div key={system.id} className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 p-3">
            <div>
              <p className="font-medium">
                {system.name}{" "}
                <span className="text-muted-foreground">
                  ({system.audience}
                  {system.modalities?.[0]
                    ? ` · ${system.modalities[0].name}`
                    : ""})
                </span>
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href={`/belts/systems/${system.id}/belts/new`}
                className="text-primary hover:underline"
              >
                Nova faixa
              </Link>
              <Link
                href={`/belts/systems/${system.id}/edit`}
                className="text-primary hover:underline"
              >
                Editar
              </Link>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {(beltsBySystem.get(system.id) ?? []).map((belt) => (
                <tr key={belt.id} className="border-t border-border">
                  <td className="w-8 p-3">
                    <span
                      className="inline-block size-4 rounded-full border border-border"
                      style={{ backgroundColor: belt.color_hex ?? undefined }}
                    />
                  </td>
                  <td className="p-3">{belt.name}</td>
                  <td className="p-3 text-muted-foreground">
                    Ordem {belt.ordering} · até {belt.max_degrees} graus
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/belts/individual/${belt.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {!beltsBySystem.get(system.id)?.length && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    Nenhuma faixa cadastrada neste sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {!beltSystems?.length && (
        <p className="text-muted-foreground">
          Nenhum sistema de faixa cadastrado.
        </p>
      )}
    </div>
  );
}
