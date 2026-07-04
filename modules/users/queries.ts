import { createClient } from "@/lib/supabase/server";

export type CurrentUserProfile = {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  role: "admin" | "teacher";
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, school_id, name, email, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    schoolId: data.school_id,
    name: data.name,
    email: data.email,
    role: data.role as CurrentUserProfile["role"],
  };
}
