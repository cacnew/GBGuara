"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openOrReuseClassSession } from "@/modules/classes/sessions";

export function OpenSessionButton({ classGroupId }: { classGroupId: string }) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  async function handleClick() {
    setIsOpening(true);
    const result = await openOrReuseClassSession(classGroupId);
    setIsOpening(false);

    if (result.error || !result.sessionId) {
      toast.error(result.error ?? "Não foi possível abrir a chamada");
      return;
    }

    router.push(`/attendance/${result.sessionId}`);
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={isOpening}>
      {isOpening ? "Abrindo..." : "Abrir chamada"}
    </Button>
  );
}
