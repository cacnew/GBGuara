import { createClient } from "@/lib/supabase/server";

export type CurrentStudentProfile = {
  id: string;
  schoolId: string;
  unitId: string;
  name: string;
  email: string | null;
  status: "ativo" | "inativo" | "pausado" | "cancelado" | "inadimplente";
  mustChangePassword: boolean;
};

export async function getCurrentStudentProfile(): Promise<CurrentStudentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("students")
    .select("id, school_id, unit_id, name, email, status, must_change_password")
    .eq("auth_user_id", user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    schoolId: data.school_id,
    unitId: data.unit_id,
    name: data.name,
    email: data.email,
    status: data.status as CurrentStudentProfile["status"],
    mustChangePassword: data.must_change_password,
  };
}
