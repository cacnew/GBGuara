import { getPublishedLandingPage } from "@/modules/landing/queries";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const landing = await getPublishedLandingPage();
  const bg =
    landing.hero.backgroundUrl ||
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=2200&q=80";

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative z-10">
        <LoginForm
          academyName={landing.identity.displayName}
          logoUrl={landing.identity.logoUrl || landing.identity.logoLightUrl}
        />
      </div>
    </div>
  );
}
