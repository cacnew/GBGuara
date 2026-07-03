import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/users/queries";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "teacher") redirect("/dashboard");

  return <>{children}</>;
}
