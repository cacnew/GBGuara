"use client";

import { useActionState, useRef, useState } from "react";
import { Save, Send, EyeOff } from "lucide-react";
import { saveLandingPage, type LandingActionState } from "@/modules/landing/actions";
import type { LandingPageData } from "@/modules/landing/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AdminOptions = {
  teachers: { id: string; name: string; photo_url: string | null }[];
  classGroups: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    week_days: number[];
    modalities: { name: string } | null;
    teachers: { name: string } | null;
  }[];
};

const initialState: LandingActionState = {};
const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function LandingImageUpload({
  label,
  name,
  schoolId,
  defaultValue,
  hint,
  aspect = "wide",
}: {
  label: string;
  name: string;
  schoolId: string;
  defaultValue?: string;
  hint?: string;
  aspect?: "logo" | "wide" | "portrait";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${schoolId}/landing/${name}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    setIsUploading(false);

    if (uploadError) {
      setError("Nao foi possivel enviar a imagem.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setUrl(data.publicUrl);
  }

  const previewClass =
    aspect === "logo"
      ? "h-24"
      : aspect === "portrait"
        ? "aspect-[3/4]"
        : "aspect-video";

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={url} />
      <div className={`overflow-hidden rounded-lg border border-border bg-background ${previewClass}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Nenhuma imagem enviada
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Enviando..." : "Enviar imagem"}
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
            Remover
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LandingForm({
  landing,
  options,
  uploadSchoolId,
}: {
  landing: LandingPageData;
  options: AdminOptions;
  uploadSchoolId: string;
}) {
  const [state, formAction, pending] = useActionState(saveLandingPage, initialState);
  const selectedTeacherIds = new Set(landing.teachers.map((teacher) => teacher.id));
  const selectedClassIds = new Set(landing.classes.map((classGroup) => classGroup.id));
  const landingPhotoByTeacherId = new Map(landing.teachers.map((teacher) => [teacher.id, teacher.photoUrl]));

  return (
    <form action={formAction} className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Status atual: {landing.status}</p>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
              <Save /> Salvar rascunho
            </Button>
            <Button type="submit" name="intent" value="unpublish" variant="secondary" disabled={pending}>
              <EyeOff /> Despublicar
            </Button>
            <Button type="submit" name="intent" value="publish" disabled={pending}>
              <Send /> Publicar
            </Button>
          </div>
        </div>
      </div>

      <Section title="Identidade da Academia" description="Dados que identificam a academia em toda a pagina publica.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome oficial" name="officialName" defaultValue={landing.identity.officialName} />
          <Field label="Nome de exibicao" name="displayName" defaultValue={landing.identity.displayName} />
          <Field label="Nome curto" name="shortName" defaultValue={landing.identity.shortName} />
          <Field label="Slogan" name="slogan" defaultValue={landing.identity.slogan} />
          <Field label="Cor principal" name="primaryColor" type="color" defaultValue={landing.identity.primaryColor} />
          <Field label="Cor secundaria" name="secondaryColor" type="color" defaultValue={landing.identity.secondaryColor} />
        </div>
        <TextArea label="Descricao institucional" name="description" defaultValue={landing.identity.description} rows={3} />
        <div className="grid gap-4 md:grid-cols-2">
          <LandingImageUpload
            label="Logotipo principal"
            name="logoUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.identity.logoUrl}
            aspect="logo"
            hint="Sugestao: PNG ou WebP com fundo transparente, largura minima de 600 px."
          />
          <LandingImageUpload
            label="Logotipo para fundo claro"
            name="logoLightUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.identity.logoLightUrl}
            aspect="logo"
            hint="Use uma versao com bom contraste sobre fundo branco."
          />
          <LandingImageUpload
            label="Logotipo para fundo escuro"
            name="logoDarkUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.identity.logoDarkUrl}
            aspect="logo"
            hint="Use uma versao clara ou colorida com bom contraste sobre fundo escuro."
          />
          <LandingImageUpload
            label="Favicon"
            name="faviconUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.identity.faviconUrl}
            aspect="logo"
            hint="Sugestao: PNG quadrado em 512 x 512 px."
          />
          <LandingImageUpload
            label="Imagem de compartilhamento"
            name="shareImageUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.identity.shareImageUrl}
            hint="Sugestao: 1200 x 630 px para WhatsApp e redes sociais."
          />
        </div>
      </Section>

      <Section title="Contato e Localizacao" description="Usado no cabecalho, CTA final, rodape e login.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Telefone" name="phone" defaultValue={landing.identity.phone} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={landing.identity.whatsapp} />
          <Field label="E-mail" name="email" defaultValue={landing.identity.email} />
          <Field label="Instagram" name="instagram" defaultValue={landing.identity.instagram} />
          <Field label="Facebook" name="facebook" defaultValue={landing.identity.facebook} />
          <Field label="YouTube" name="youtube" defaultValue={landing.identity.youtube} />
          <Field label="TikTok" name="tiktok" defaultValue={landing.identity.tiktok} />
          <Field label="Cidade" name="city" defaultValue={landing.identity.city} />
          <Field label="Estado" name="state" defaultValue={landing.identity.state} />
        </div>
        <Field label="Endereco" name="address" defaultValue={landing.identity.address} />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Complemento" name="complement" defaultValue={landing.identity.complement} />
          <Field label="CEP" name="zipCode" defaultValue={landing.identity.zipCode} />
          <Field label="Horario de funcionamento" name="openingHours" defaultValue={landing.identity.openingHours} />
        </div>
        <Field label="Link de mapa" name="mapUrl" defaultValue={landing.identity.mapUrl} />
        <TextArea label="Dados juridicos do rodape" name="legalText" defaultValue={landing.identity.legalText} rows={2} />
      </Section>

      <Section title="Cabecalho e Banner" description="Hero amplo, CTAs e destaques da primeira dobra.">
        <TextArea
          label="Menu de navegacao (JSON)"
          name="navigationJson"
          defaultValue={JSON.stringify(landing.navigation, null, 2)}
          rows={8}
          hint="Campos: label, href, visible, target."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Texto pequeno do banner" name="heroEyebrow" defaultValue={landing.hero.eyebrow} />
          <LandingImageUpload
            label="Imagem de fundo do banner"
            name="heroBackgroundUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.hero.backgroundUrl}
            hint="Sugestao: imagem horizontal em 2400 x 1350 px, com assunto centralizado para funcionar em desktop e celular."
          />
        </div>
        <Field label="Titulo principal" name="heroTitle" defaultValue={landing.hero.title} />
        <TextArea label="Descricao do banner" name="heroDescription" defaultValue={landing.hero.description} rows={3} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea label="Modalidades (uma por linha)" name="heroModalities" defaultValue={landing.hero.modalities.join("\n")} rows={3} />
          <TextArea label="Diferenciais (um por linha)" name="heroHighlights" defaultValue={landing.hero.highlights.join("\n")} rows={3} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CTA principal" name="heroPrimaryCtaLabel" defaultValue={landing.hero.primaryCtaLabel} />
          <Field label="Link CTA principal" name="heroPrimaryCtaHref" defaultValue={landing.hero.primaryCtaHref} />
          <Field label="CTA secundario" name="heroSecondaryCtaLabel" defaultValue={landing.hero.secondaryCtaLabel} />
          <Field label="Link CTA secundario" name="heroSecondaryCtaHref" defaultValue={landing.hero.secondaryCtaHref} />
        </div>
      </Section>

      <Section title="Indicadores" description="Numeros de impacto exibidos logo apos o banner.">
        <TextArea
          label="Indicadores (JSON)"
          name="metricsJson"
          defaultValue={JSON.stringify(landing.metrics, null, 2)}
          rows={10}
          hint="Campos: value, suffix, label, visible."
        />
      </Section>

      <Section title="Professores e Turmas" description="Escolha quais cadastros reais aparecem na landing.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Professores publicados</h3>
            <div className="max-h-[32rem] overflow-y-auto rounded-lg border border-border bg-background">
              {options.teachers.map((teacher) => {
                const isSelected = selectedTeacherIds.has(teacher.id);
                return (
                  <div key={teacher.id} className="space-y-3 border-b border-border p-3 text-sm last:border-0">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="teacherIds"
                        value={teacher.id}
                        defaultChecked={isSelected}
                      />
                      {teacher.name}
                    </label>
                    {isSelected && (
                      <LandingImageUpload
                        label="Foto para a landing (opcional)"
                        name={`teacherPhoto_${teacher.id}`}
                        schoolId={uploadSchoolId}
                        defaultValue={landingPhotoByTeacherId.get(teacher.id) || teacher.photo_url || ""}
                        aspect="portrait"
                        hint="Sugestao: foto de rosto/corpo simples, sem texto ou arte promocional — o card da landing ja desenha nome e cargo por cima. Se vazio, usa a foto do cadastro do professor."
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Turmas exibidas nos horarios</h3>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background">
              {options.classGroups.map((group) => (
                <label key={group.id} className="flex items-start gap-2 border-b border-border p-3 text-sm last:border-0">
                  <input
                    type="checkbox"
                    name="classGroupIds"
                    value={group.id}
                    defaultChecked={selectedClassIds.has(group.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{group.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {(group.week_days ?? []).map((day) => dayLabels[day]).join(", ")} · {group.start_time.slice(0, 5)} · {group.modalities?.name ?? "Modalidade"} · {group.teachers?.name ?? "Professor"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Sobre, Campanha e Contato" description="Conteudos editoriais das secoes finais.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sobre: chamada" name="aboutEyebrow" defaultValue={landing.about.eyebrow} />
          <Field label="Sobre: titulo" name="aboutTitle" defaultValue={landing.about.title} />
        </div>
        <TextArea label="Sobre: texto" name="aboutBody" defaultValue={landing.about.body} rows={4} />
        <LandingImageUpload
          label="Sobre: imagem"
          name="aboutImageUrl"
          schoolId={uploadSchoolId}
          defaultValue={landing.about.imageUrl}
          aspect="portrait"
          hint="Sugestao: imagem vertical em 1200 x 1600 px, com pessoas/tatame no centro."
        />
        <TextArea label="Sobre: diferenciais (um por linha)" name="aboutFeatures" defaultValue={landing.about.features.join("\n")} rows={4} />

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="campaignActive" defaultChecked={landing.campaign.active} />
          Campanha ativa
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Campanha: chamada" name="campaignEyebrow" defaultValue={landing.campaign.eyebrow} />
          <Field label="Campanha: titulo" name="campaignTitle" defaultValue={landing.campaign.title} />
          <Field label="Campanha: subtitulo" name="campaignSubtitle" defaultValue={landing.campaign.subtitle} />
          <LandingImageUpload
            label="Campanha: imagem"
            name="campaignImageUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.campaign.imageUrl}
            aspect="portrait"
            hint="Sugestao: imagem vertical em 1200 x 1600 px para manter o impacto visual da secao."
          />
        </div>
        <TextArea label="Campanha: texto" name="campaignBody" defaultValue={landing.campaign.body} rows={4} />
        <TextArea label="Campanha: estatisticas (JSON)" name="campaignStatsJson" defaultValue={JSON.stringify(landing.campaign.stats, null, 2)} rows={6} />
        <TextArea label="Campanha: beneficios (um por linha)" name="campaignBenefits" defaultValue={landing.campaign.benefits.join("\n")} rows={4} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Campanha: CTA" name="campaignCtaLabel" defaultValue={landing.campaign.ctaLabel} />
          <Field label="Campanha: link CTA" name="campaignCtaHref" defaultValue={landing.campaign.ctaHref} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contato: chamada" name="contactEyebrow" defaultValue={landing.contact.eyebrow} />
          <Field label="Contato: titulo" name="contactTitle" defaultValue={landing.contact.title} />
          <LandingImageUpload
            label="Contato: imagem"
            name="contactImageUrl"
            schoolId={uploadSchoolId}
            defaultValue={landing.contact.imageUrl}
            hint="Sugestao: imagem horizontal em 1800 x 1000 px, mostrando fachada, tatame ou turma."
          />
          <Field label="Contato: botao WhatsApp" name="contactWhatsappLabel" defaultValue={landing.contact.whatsappLabel} />
          <Field label="Contato: botao mapa" name="contactMapLabel" defaultValue={landing.contact.mapLabel} />
        </div>
        <TextArea label="Contato: texto" name="contactBody" defaultValue={landing.contact.body} rows={3} />
      </Section>

      <Section title="SEO e Rodape" description="Metadados, links juridicos e credito institucional.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titulo SEO" name="seoTitle" defaultValue={landing.seo.title} />
          <Field label="Descricao SEO" name="seoDescription" defaultValue={landing.seo.description} />
        </div>
        <TextArea label="Links do rodape (JSON)" name="footerLinksJson" defaultValue={JSON.stringify(landing.footer.legalLinks, null, 2)} rows={6} />
        <Field label="Credito do sistema" name="systemCredit" defaultValue={landing.footer.systemCredit} />
      </Section>
    </form>
  );
}
