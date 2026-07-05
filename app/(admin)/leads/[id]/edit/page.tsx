import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WhatsAppSend } from "@/components/forms/whatsapp-send";
import { sendWhatsAppToLead } from "@/modules/whatsapp/actions";
import type { LeadInput } from "@/lib/validations/lead";
import { EditLeadForm } from "./form";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone, email, source, status, notes, converted_student_id")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Editar lead</h1>
      </div>
      <EditLeadForm
        id={lead.id}
        convertedStudentId={lead.converted_student_id}
        defaultValues={{
          name: lead.name,
          phone: lead.phone ?? "",
          email: lead.email ?? "",
          source: lead.source ?? "",
          status: lead.status as LeadInput["status"],
          notes: lead.notes ?? "",
        }}
      />
      <div className="w-full max-w-sm">
        <WhatsAppSend
          phone={lead.phone}
          onSend={sendWhatsAppToLead.bind(null, lead.id)}
        />
      </div>
    </div>
  );
}
