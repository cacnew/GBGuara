import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AvatarInitials({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("size-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
