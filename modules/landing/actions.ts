"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { defaultLandingContent, type LandingContent } from "./defaults";

export type LandingActionState = {
  error?: string;
  success?: string;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function textareaList(formData: FormData, key: string): string[] {
  return text(formData, key)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = text(formData, key);
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function selectedIds(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => String(value))
    .filter(Boolean);
}

export async function saveLandingPage(
  _prevState: LandingActionState,
  formData: FormData,
): Promise<LandingActionState> {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const intent = text(formData, "intent");

  try {
    const content: LandingContent = {
      identity: {
        ...defaultLandingContent.identity,
        officialName: text(formData, "officialName"),
        displayName: text(formData, "displayName"),
        shortName: text(formData, "shortName"),
        slogan: text(formData, "slogan"),
        description: text(formData, "description"),
        logoUrl: text(formData, "logoUrl"),
        logoLightUrl: text(formData, "logoLightUrl"),
        logoDarkUrl: text(formData, "logoDarkUrl"),
        faviconUrl: text(formData, "faviconUrl"),
        shareImageUrl: text(formData, "shareImageUrl"),
        primaryColor: text(formData, "primaryColor") || defaultLandingContent.identity.primaryColor,
        secondaryColor: text(formData, "secondaryColor") || defaultLandingContent.identity.secondaryColor,
        accentColor: text(formData, "accentColor") || defaultLandingContent.identity.accentColor,
        phone: text(formData, "phone"),
        whatsapp: text(formData, "whatsapp"),
        email: text(formData, "email"),
        instagram: text(formData, "instagram"),
        facebook: text(formData, "facebook"),
        youtube: text(formData, "youtube"),
        tiktok: text(formData, "tiktok"),
        address: text(formData, "address"),
        complement: text(formData, "complement"),
        city: text(formData, "city"),
        state: text(formData, "state"),
        zipCode: text(formData, "zipCode"),
        mapUrl: text(formData, "mapUrl"),
        openingHours: text(formData, "openingHours"),
        legalText: text(formData, "legalText"),
      },
      navigation: parseJsonField(formData, "navigationJson", defaultLandingContent.navigation),
      hero: {
        ...defaultLandingContent.hero,
        eyebrow: text(formData, "heroEyebrow"),
        modalities: textareaList(formData, "heroModalities"),
        title: text(formData, "heroTitle"),
        description: text(formData, "heroDescription"),
        backgroundUrl: text(formData, "heroBackgroundUrl"),
        primaryCtaLabel: text(formData, "heroPrimaryCtaLabel"),
        primaryCtaHref: text(formData, "heroPrimaryCtaHref"),
        secondaryCtaLabel: text(formData, "heroSecondaryCtaLabel"),
        secondaryCtaHref: text(formData, "heroSecondaryCtaHref"),
        highlights: textareaList(formData, "heroHighlights"),
      },
      metrics: parseJsonField(formData, "metricsJson", defaultLandingContent.metrics),
      about: {
        ...defaultLandingContent.about,
        eyebrow: text(formData, "aboutEyebrow"),
        title: text(formData, "aboutTitle"),
        body: text(formData, "aboutBody"),
        imageUrl: text(formData, "aboutImageUrl"),
        features: textareaList(formData, "aboutFeatures"),
      },
      campaign: {
        ...defaultLandingContent.campaign,
        active: formData.get("campaignActive") === "on",
        eyebrow: text(formData, "campaignEyebrow"),
        title: text(formData, "campaignTitle"),
        subtitle: text(formData, "campaignSubtitle"),
        body: text(formData, "campaignBody"),
        imageUrl: text(formData, "campaignImageUrl"),
        stats: parseJsonField(formData, "campaignStatsJson", defaultLandingContent.campaign.stats),
        benefits: textareaList(formData, "campaignBenefits"),
        ctaLabel: text(formData, "campaignCtaLabel"),
        ctaHref: text(formData, "campaignCtaHref"),
      },
      contact: {
        ...defaultLandingContent.contact,
        eyebrow: text(formData, "contactEyebrow"),
        title: text(formData, "contactTitle"),
        body: text(formData, "contactBody"),
        imageUrl: text(formData, "contactImageUrl"),
        whatsappLabel: text(formData, "contactWhatsappLabel"),
        mapLabel: text(formData, "contactMapLabel"),
      },
      footer: {
        ...defaultLandingContent.footer,
        legalLinks: parseJsonField(formData, "footerLinksJson", defaultLandingContent.footer.legalLinks),
        systemCredit: text(formData, "systemCredit"),
      },
      seo: {
        title: text(formData, "seoTitle"),
        description: text(formData, "seoDescription"),
      },
    };

    const nextStatus =
      intent === "publish" ? "published" : intent === "unpublish" ? "unpublished" : "draft";

    const { data: landing, error } = await supabase
      .from("landing_pages")
      .upsert(
        {
          school_id: profile.schoolId,
          status: nextStatus,
          identity: content.identity,
          navigation: content.navigation,
          hero: content.hero,
          metrics: content.metrics,
          about: content.about,
          campaign: content.campaign,
          contact: content.contact,
          footer: content.footer,
          seo: content.seo,
          published_at: nextStatus === "published" ? new Date().toISOString() : null,
        },
        { onConflict: "school_id" },
      )
      .select("id")
      .single();

    if (error || !landing) {
      return { error: error?.message ?? "Nao foi possivel salvar a landing page." };
    }

    const teacherIds = selectedIds(formData, "teacherIds");
    const teacherPhotoOverrides = Object.fromEntries(
      teacherIds.map((id) => [id, text(formData, `teacherPhoto_${id}`)]),
    );
    await syncTeachers(supabase, profile.schoolId, teacherIds, teacherPhotoOverrides);
    await syncClasses(supabase, profile.schoolId, selectedIds(formData, "classGroupIds"));

    await logAuditEvent({
      supabase,
      schoolId: profile.schoolId,
      userId: profile.id,
      entityType: "landing_page",
      entityId: landing.id,
      action: nextStatus === "published" ? "landing_published" : "landing_saved",
    });

    revalidatePath("/");
    revalidatePath("/landing");
    revalidatePath("/login");
    revalidatePath("/admin/landing");

    return {
      success:
        nextStatus === "published"
          ? "Landing page publicada."
          : nextStatus === "unpublished"
            ? "Landing page despublicada."
            : "Rascunho salvo.",
    };
  } catch (error) {
    return {
      error:
        error instanceof SyntaxError
          ? "Um dos campos JSON esta invalido."
          : error instanceof Error
            ? error.message
            : "Nao foi possivel salvar a landing page.",
    };
  }
}

async function syncTeachers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  teacherIds: string[],
  photoOverrides: Record<string, string>,
) {
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, photo_url")
    .in("id", teacherIds.length ? teacherIds : ["00000000-0000-0000-0000-000000000000"]);

  await supabase
    .from("landing_teacher_profiles")
    .update({ status: "inactive" })
    .eq("school_id", schoolId);

  if (!teachers?.length) return;

  await supabase.from("landing_teacher_profiles").upsert(
    teachers.map((teacher, index) => ({
      school_id: schoolId,
      teacher_id: teacher.id,
      display_name: teacher.name,
      role_title: "Professor",
      photo_url: photoOverrides[teacher.id] || teacher.photo_url,
      specialties: ["Tecnica", "Disciplina", "Evolucao"],
      quote: "Compromisso com a evolucao de cada aluno no tatame.",
      ordering: index,
      status: "active",
    })),
    { onConflict: "school_id,teacher_id" },
  );
}

async function syncClasses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  classGroupIds: string[],
) {
  await supabase
    .from("landing_class_groups")
    .update({ status: "inactive" })
    .eq("school_id", schoolId);

  if (!classGroupIds.length) return;

  await supabase.from("landing_class_groups").upsert(
    classGroupIds.map((classGroupId, index) => ({
      school_id: schoolId,
      class_group_id: classGroupId,
      ordering: index,
      status: "active",
    })),
    { onConflict: "school_id,class_group_id" },
  );
}
