import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function ModalitiesPage() {
  const supabase = await createClient();
  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name, slug, status")
    .order("name");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Modalidades</h1>
        <Link href="/modalities/new" className={buttonVariants()}>
          Nova modalidade
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {modalities?.map((modality) => (
              <tr key={modality.id} className="border-t border-border">
                <td className="p-3">{modality.name}</td>
                <td className="p-3 text-muted-foreground">{modality.slug}</td>
                <td className="p-3">
                  {modality.status === "active" ? "Ativa" : "Inativa"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/modalities/${modality.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!modalities?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  Nenhuma modalidade cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
