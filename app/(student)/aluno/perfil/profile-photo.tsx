"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { updateStudentPhoto } from "@/modules/students/account-actions";

export function ProfilePhoto({
  schoolId,
  studentId,
  currentUrl,
}: {
  schoolId: string;
  studentId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();

  async function handleUploaded(url: string) {
    await updateStudentPhoto(url);
    toast.success("Foto atualizada.");
    router.refresh();
  }

  return (
    <AvatarUpload
      schoolId={schoolId}
      entityType="students"
      entityId={studentId}
      currentUrl={currentUrl}
      onUploaded={handleUploaded}
    />
  );
}
