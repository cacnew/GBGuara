import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, LockKeyhole, MapPin, Menu, Phone } from "lucide-react";
import { getPublishedLandingPage } from "@/modules/landing/queries";
import { LandingSchedule } from "./landing-schedule";

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#contato";
}

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getPublishedLandingPage();
  const image = landing.identity.shareImageUrl || landing.hero.backgroundUrl;

  return {
    title: landing.seo.title || landing.identity.displayName,
    description: landing.seo.description || landing.identity.description,
    openGraph: {
      title: landing.seo.title || landing.identity.displayName,
      description: landing.seo.description || landing.identity.description,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
  };
}

export default async function Home() {
  const landing = await getPublishedLandingPage();
  const primary = landing.identity.primaryColor || "#C8102E";
  const heroBg =
    landing.hero.backgroundUrl ||
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=2400&q=80";
  const aboutImage =
    landing.about.imageUrl ||
    "https://images.unsplash.com/photo-1577303935007-0d306ee638cf?auto=format&fit=crop&w=1600&q=80";
  const campaignImage =
    landing.campaign.imageUrl ||
    "https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?auto=format&fit=crop&w=1600&q=80";
  const contactImage =
    landing.contact.imageUrl ||
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80";

  return (
    <main
      className="landing-page"
      style={
        {
          "--landing-primary": primary,
          "--landing-secondary": landing.identity.secondaryColor || "#0B0B0F",
        } as CSSProperties
      }
    >
      <header className="landing-header">
        <Link href="#top" className="landing-brand" aria-label={landing.identity.displayName}>
          {landing.identity.logoDarkUrl || landing.identity.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={landing.identity.logoDarkUrl || landing.identity.logoUrl} alt={landing.identity.displayName} />
          ) : (
            <span>{landing.identity.shortName}</span>
          )}
        </Link>
        <nav className="landing-nav" aria-label="Navegacao principal">
          {landing.navigation
            .filter((item) => item.visible)
            .map((item) => (
              <Link key={`${item.href}-${item.label}`} href={item.href} target={item.target}>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="landing-header-actions">
          <Link className="landing-restricted" href="/login">
            <LockKeyhole /> Acesso restrito
          </Link>
          <Link className="landing-primary-button" href={landing.hero.primaryCtaHref}>
            {landing.hero.primaryCtaLabel}
          </Link>
          <button className="landing-mobile-menu" aria-label="Abrir menu" type="button">
            <Menu />
          </button>
        </div>
      </header>

      <section id="top" className="landing-hero">
        <div className="landing-hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-copy">
            <div className="landing-modalities">
              {landing.hero.modalities.map((modality) => (
                <span key={modality}>{modality}</span>
              ))}
            </div>
            <p className="landing-eyebrow">{landing.hero.eyebrow}</p>
            <h1>{landing.hero.title}</h1>
            <p className="landing-hero-description">{landing.hero.description}</p>
            <div className="landing-hero-buttons">
              <Link className="landing-primary-button" href={landing.hero.primaryCtaHref}>
                {landing.hero.primaryCtaLabel} <ArrowRight />
              </Link>
              <Link className="landing-secondary-button" href={landing.hero.secondaryCtaHref}>
                {landing.hero.secondaryCtaLabel}
              </Link>
            </div>
          </div>
          <div className="landing-hero-panel">
            <p>{landing.identity.slogan}</p>
            <ul>
              {landing.hero.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        </div>
        <Link href="#indicadores" className="landing-scroll">
          <ArrowDown /> Role para conhecer
        </Link>
      </section>

      <section id="indicadores" className="landing-metrics">
        {landing.metrics
          .filter((metric) => metric.visible)
          .map((metric) => (
            <div key={`${metric.value}-${metric.label}`}>
              <strong>
                {metric.value}
                {metric.suffix}
              </strong>
              <span>{metric.label}</span>
            </div>
          ))}
      </section>

      <section id="professores" className="landing-section landing-dark">
        <div className="landing-section-heading">
          <p>Equipe tecnica</p>
          <h2>Professores e instrutores</h2>
        </div>
        <div className="landing-teachers">
          {landing.teachers.map((teacher) => (
            <article key={teacher.id} className="landing-teacher-card">
              <div className="landing-teacher-photo">
                {teacher.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teacher.photoUrl} alt={teacher.displayName} />
                ) : (
                  <span>{teacher.displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="landing-teacher-info">
                <p>{teacher.roleTitle}</p>
                <h3>{teacher.displayName}</h3>
                {teacher.beltLabel && <span>{teacher.beltLabel}</span>}
                <small>{teacher.quote}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="horarios" className="landing-section landing-light">
        <div className="landing-section-heading landing-centered">
          <p>Grade semanal</p>
          <h2>Escolha o melhor horario para treinar</h2>
        </div>
        <LandingSchedule classes={landing.classes} />
      </section>

      <section id="sobre" className="landing-about">
        <div className="landing-about-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aboutImage} alt={landing.about.title} />
        </div>
        <div className="landing-about-copy">
          <p className="landing-eyebrow">{landing.about.eyebrow}</p>
          <h2>{landing.about.title}</h2>
          <p>{landing.about.body}</p>
          <ul>
            {landing.about.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </section>

      {landing.campaign.active && (
        <section id="campanha" className="landing-campaign">
          <div className="landing-campaign-copy">
            <p className="landing-eyebrow">{landing.campaign.eyebrow}</p>
            <h2>{landing.campaign.title}</h2>
            <h3>{landing.campaign.subtitle}</h3>
            <p>{landing.campaign.body}</p>
            <div className="landing-campaign-stats">
              {landing.campaign.stats
                .filter((stat) => stat.visible)
                .map((stat) => (
                  <div key={`${stat.value}-${stat.label}`}>
                    <strong>
                      {stat.value}
                      {stat.suffix}
                    </strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
            </div>
            <ul>
              {landing.campaign.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <Link className="landing-primary-button" href={landing.campaign.ctaHref}>
              {landing.campaign.ctaLabel}
            </Link>
          </div>
          <div className="landing-campaign-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campaignImage} alt={landing.campaign.title} />
          </div>
        </section>
      )}

      <section id="contato" className="landing-contact">
        <div className="landing-contact-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={contactImage} alt={landing.contact.title} />
        </div>
        <div className="landing-contact-card">
          <p className="landing-eyebrow">{landing.contact.eyebrow}</p>
          <h2>{landing.contact.title}</h2>
          <p>{landing.contact.body}</p>
          <div className="landing-contact-lines">
            {landing.identity.phone && (
              <span>
                <Phone /> {landing.identity.phone}
              </span>
            )}
            {(landing.identity.address || landing.identity.city) && (
              <span>
                <MapPin /> {[landing.identity.address, landing.identity.city, landing.identity.state].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <div className="landing-hero-buttons">
            <Link className="landing-primary-button" href={whatsappHref(landing.identity.whatsapp || landing.identity.phone)}>
              {landing.contact.whatsappLabel}
            </Link>
            {landing.identity.mapUrl && (
              <Link className="landing-secondary-button" href={landing.identity.mapUrl} target="_blank">
                {landing.contact.mapLabel}
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <strong>{landing.identity.displayName}</strong>
          <p>{landing.identity.legalText || landing.identity.description}</p>
        </div>
        <nav>
          {landing.footer.legalLinks
            .filter((link) => link.visible)
            .map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} target={link.target}>
                {link.label}
              </Link>
            ))}
        </nav>
        <p>
          © {new Date().getFullYear()} {landing.identity.displayName}. {landing.footer.systemCredit}
        </p>
      </footer>
    </main>
  );
}
