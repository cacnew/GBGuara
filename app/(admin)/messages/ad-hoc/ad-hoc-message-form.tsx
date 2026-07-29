"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { sendAdHocMessage } from "./actions";

export type RecipientOption = {
  type: "aluno" | "professor" | "lead";
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

const TYPE_LABEL: Record<RecipientOption["type"], string> = {
  aluno: "Aluno",
  professor: "Professor",
  lead: "Lead",
};

export function AdHocMessageForm({ recipients }: { recipients: RecipientOption[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<RecipientOption | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [sendEmailChannel, setSendEmailChannel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return recipients.filter((r) => r.name.toLowerCase().includes(query)).slice(0, 10);
  }, [search, recipients]);

  function selectRecipient(recipient: RecipientOption) {
    setSelected(recipient);
    setRecipientName(recipient.name);
    setPhone(recipient.phone ?? "");
    setEmail(recipient.email ?? "");
    setSearch("");
    setShowResults(false);
  }

  function clearSelection() {
    setSelected(null);
    setRecipientName("");
    setPhone("");
    setEmail("");
  }

  function resetForm() {
    clearSelection();
    setSearch("");
    setSubject("");
    setMessage("");
    setSendWhatsapp(false);
    setSendEmailChannel(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!recipientName.trim()) {
      toast.error("Informe um nome para identificar o destinatário.");
      return;
    }
    if (!message.trim()) {
      toast.error("Escreva uma mensagem antes de enviar.");
      return;
    }
    if (!sendWhatsapp && !sendEmailChannel) {
      toast.error("Selecione ao menos um canal de envio (WhatsApp ou E-mail).");
      return;
    }
    if (sendWhatsapp && !phone.trim()) {
      toast.error("Informe o telefone para enviar por WhatsApp.");
      return;
    }
    if (sendEmailChannel && (!email.trim() || !subject.trim())) {
      toast.error("Informe e-mail e assunto para enviar por e-mail.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendAdHocMessage({
      recipientType: selected?.type ?? "manual",
      recipientId: selected?.id,
      recipientName,
      phone,
      email,
      subject,
      message,
      sendWhatsapp,
      sendEmail: sendEmailChannel,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.whatsappError) {
      toast.error(`WhatsApp: ${result.whatsappError}`);
    }
    if (result.emailError) {
      toast.error(`E-mail: ${result.emailError}`);
    }

    if (!result.whatsappError && !result.emailError) {
      toast.success("Mensagem enviada.");
      resetForm();
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-lg space-y-5 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="recipientSearch">Buscar cadastro (aluno, professor ou lead)</Label>
        <div className="relative">
          <Input
            id="recipientSearch"
            placeholder="Digite um nome..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            autoComplete="off"
          />
          {showResults && filtered.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-md">
              {filtered.map((recipient) => (
                <li key={`${recipient.type}-${recipient.id}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectRecipient(recipient)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <StatusBadge value={recipient.type} label={TYPE_LABEL[recipient.type]} />
                      {recipient.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {recipient.phone || recipient.email || "-"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted p-2.5 text-sm">
            <span className="flex items-center gap-2">
              <StatusBadge value={selected.type} label={TYPE_LABEL[selected.type]} />
              {selected.name}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-bold text-primary hover:underline"
            >
              Trocar / digitar manualmente
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Ou preencha os campos abaixo manualmente, sem selecionar um cadastro.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recipientName">Nome do destinatário</Label>
        <Input
          id="recipientName"
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          placeholder="Ex.: Maria Silva"
        />
      </div>

      <div className="space-y-2.5 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={sendWhatsapp}
            onChange={(event) => setSendWhatsapp(event.target.checked)}
          />
          Enviar por WhatsApp
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 91234-5678"
          />
        </div>
      </div>

      <div className="space-y-2.5 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={sendEmailChannel}
            onChange={(event) => setSendEmailChannel(event.target.checked)}
          />
          Enviar por E-mail
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="pessoa@exemplo.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">Assunto</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Assunto do e-mail"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" disabled checked={false} readOnly />
        Enviar por Push (em breve — ainda não disponível no app)
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensagem</Label>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
