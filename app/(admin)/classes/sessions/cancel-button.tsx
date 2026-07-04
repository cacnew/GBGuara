"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelClassSession } from "@/modules/classes/sessions";

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleClick() {
    setIsCancelling(true);
    const result = await cancelClassSession(sessionId);
    setIsCancelling(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sessão cancelada.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCancelling}
      className="text-sm text-destructive hover:underline disabled:opacity-50"
    >
      {isCancelling ? "Cancelando..." : "Cancelar"}
    </button>
  );
}
