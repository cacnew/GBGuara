import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function BackLink({
  href,
  label = "Voltar",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className={buttonVariants({ variant: "outline" })}>
      {label}
    </Link>
  );
}
