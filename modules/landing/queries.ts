import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { mergeContent, type LandingContent } from "./defaults";

export type LandingTeacher = {
  id: string;
  displayName: string;
  roleTitle: string;
  beltLabel: string;
  photoUrl: string;
  specialties: string[];
  quote: string;
  bio: string;
  instagramUrl: string;
  ordering: number;
};

export type LandingScheduleClass = {
  id: string;
  name: string;
  modality: string;
  teacher: string;
  weekDays: number[];
  startTime: string;
  endTime: string;
  ordering: number;
};

export type LandingPageData = LandingContent & {
  id: string | null;
  schoolId: string | null;
  status: string;
  teachers: LandingTeacher[];
  classes: LandingScheduleClass[];
};

type LandingRow = {
  id: string;
  school_id: string;
  status: string;
  identity: unknown;
  navigation: unknown;
  hero: unknown;
  metrics: unknown;
  about: unknown;
  campaign: unknown;
  contact: unknown;
  footer: unknown;
  seo: unknown;
};

function rowToContent(row: LandingRow | null): LandingPageData {
  const content = mergeContent(
    row
      ? {
          identity: row.identity as never,
          navigation: row.navigation as never,
          hero: row.hero as never,
          metrics: row.metrics as never,
          about: row.about as never,
          campaign: row.campaign as never,
          contact: row.contact as never,
          footer: row.footer as never,
          seo: row.seo as never,
        }
      : null,
  );

  return {
    ...content,
    id: row?.id ?? null,
    schoolId: row?.school_id ?? null,
    status: row?.status ?? "draft",
    teachers: [],
    classes: [],
  };
}

export async function getAdminLandingPage(): Promise<LandingPageData> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("landing_pages")
    .select("*")
    .maybeSingle();

  const data = rowToContent((row as LandingRow | null) ?? null);
  const [teachers, classes] = await Promise.all([
    getAdminLandingTeachers(data.schoolId),
    getAdminLandingClasses(data.schoolId),
  ]);

  return { ...data, teachers, classes };
}

export async function getPublishedLandingPage(): Promise<LandingPageData> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    const { data: school } = await supabase
      .from("schools")
      .select("id, name, phone, email, address, city, state")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const fallback = rowToContent(null);
    if (school) {
      fallback.schoolId = school.id;
      fallback.identity.displayName = school.name;
      fallback.identity.officialName = school.name;
      fallback.identity.shortName = school.name;
      fallback.identity.phone = school.phone ?? "";
      fallback.identity.email = school.email ?? "";
      fallback.identity.address = school.address ?? "";
      fallback.identity.city = school.city ?? "";
      fallback.identity.state = school.state ?? "";
      fallback.seo.title = `${school.name} | Jiu-jitsu para todos`;
    }
    return {
      ...fallback,
      teachers: await getPublicLandingTeachers(fallback.schoolId),
      classes: await getPublicLandingClasses(fallback.schoolId),
    };
  }

  const data = rowToContent(row as LandingRow);
  const [teachers, classes] = await Promise.all([
    getPublicLandingTeachers(data.schoolId),
    getPublicLandingClasses(data.schoolId),
  ]);

  return { ...data, teachers, classes };
}

async function getAdminLandingTeachers(schoolId: string | null): Promise<LandingTeacher[]> {
  const supabase = await createClient();
  let query = supabase
    .from("landing_teacher_profiles")
    .select("*, teachers(photo_url)")
    .order("ordering", { ascending: true });

  if (schoolId) query = query.eq("school_id", schoolId);

  const { data } = await query;
  return (data ?? []).map((teacher) => ({
    id: teacher.teacher_id ?? teacher.id,
    displayName: teacher.display_name,
    roleTitle: teacher.role_title ?? "Instrutor",
    beltLabel: teacher.belt_label ?? "",
    photoUrl: teacher.photo_url || teacher.teachers?.photo_url || "",
    specialties: teacher.specialties ?? [],
    quote: teacher.quote ?? "",
    bio: teacher.bio ?? "",
    instagramUrl: teacher.instagram_url ?? "",
    ordering: teacher.ordering,
  }));
}

async function getPublicLandingTeachers(schoolId: string | null): Promise<LandingTeacher[]> {
  const supabase = createAdminClient();
  if (!schoolId) return [];

  const { data: profiles } = await supabase
    .from("landing_teacher_profiles")
    .select("*, teachers(photo_url)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("ordering", { ascending: true });

  if (profiles?.length) {
    return profiles.map((teacher) => ({
      id: teacher.id,
      displayName: teacher.display_name,
      roleTitle: teacher.role_title ?? "Instrutor",
      beltLabel: teacher.belt_label ?? "",
      photoUrl: teacher.photo_url || teacher.teachers?.photo_url || "",
      specialties: teacher.specialties ?? [],
      quote: teacher.quote ?? "",
      bio: teacher.bio ?? "",
      instagramUrl: teacher.instagram_url ?? "",
      ordering: teacher.ordering,
    }));
  }

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, photo_url")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("name")
    .limit(6);

  return (teachers ?? []).map((teacher, index) => ({
    id: teacher.id,
    displayName: teacher.name,
    roleTitle: "Professor",
    beltLabel: "",
    photoUrl: teacher.photo_url ?? "",
    specialties: ["Tecnica", "Disciplina", "Evolucao"],
    quote: "Compromisso com a evolucao de cada aluno no tatame.",
    bio: "",
    instagramUrl: "",
    ordering: index,
  }));
}

async function getAdminLandingClasses(schoolId: string | null): Promise<LandingScheduleClass[]> {
  const supabase = await createClient();
  let query = supabase
    .from("landing_class_groups")
    .select(
      "id, ordering, label_override, class_groups(id, name, start_time, end_time, week_days, modalities(name), teachers(name))",
    )
    .order("ordering", { ascending: true });

  if (schoolId) query = query.eq("school_id", schoolId);

  const { data } = await query;
  return (data ?? []).flatMap((row) => {
    const group = row.class_groups;
    if (!group) return [];
    return [
      {
        id: group.id,
        name: row.label_override || group.name,
        modality: group.modalities?.name ?? "",
        teacher: group.teachers?.name ?? "",
        weekDays: group.week_days ?? [],
        startTime: group.start_time,
        endTime: group.end_time,
        ordering: row.ordering,
      },
    ];
  });
}

async function getPublicLandingClasses(schoolId: string | null): Promise<LandingScheduleClass[]> {
  const supabase = createAdminClient();
  if (!schoolId) return [];

  const { data: selected } = await supabase
    .from("landing_class_groups")
    .select(
      "id, ordering, label_override, class_groups(id, name, start_time, end_time, week_days, modalities(name), teachers(name))",
    )
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("ordering", { ascending: true });

  const selectedClasses = (selected ?? []).flatMap((row) => {
    const group = row.class_groups;
    if (!group) return [];
    return [
      {
        id: group.id,
        name: row.label_override || group.name,
        modality: group.modalities?.name ?? "",
        teacher: group.teachers?.name ?? "",
        weekDays: group.week_days ?? [],
        startTime: group.start_time,
        endTime: group.end_time,
        ordering: row.ordering,
      },
    ];
  });

  if (selectedClasses.length) return selectedClasses;

  const { data: groups } = await supabase
    .from("class_groups")
    .select("id, name, start_time, end_time, week_days, modalities(name), teachers(name)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("start_time")
    .limit(30);

  return (groups ?? []).map((group, index) => ({
    id: group.id,
    name: group.name,
    modality: group.modalities?.name ?? "",
    teacher: group.teachers?.name ?? "",
    weekDays: group.week_days ?? [],
    startTime: group.start_time,
    endTime: group.end_time,
    ordering: index,
  }));
}

export async function getLandingAdminOptions() {
  const supabase = await createClient();
  const [{ data: teachers }, { data: classGroups }] = await Promise.all([
    supabase.from("teachers").select("id, name, photo_url").eq("status", "active").order("name"),
    supabase
      .from("class_groups")
      .select("id, name, start_time, end_time, week_days, modalities(name), teachers(name)")
      .eq("status", "active")
      .order("start_time"),
  ]);

  return {
    teachers: teachers ?? [],
    classGroups: classGroups ?? [],
  };
}
