import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/modules/users/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/professor");

  return <>{children}</>;
}
