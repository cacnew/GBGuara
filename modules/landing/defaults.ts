import type { Json } from "@/lib/supabase/database.types";

export type LandingIdentity = {
  officialName: string;
  displayName: string;
  shortName: string;
  slogan: string;
  description: string;
  logoUrl: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  shareImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  address: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  mapUrl: string;
  openingHours: string;
  legalText: string;
};

export type LandingNavItem = {
  label: string;
  href: string;
  visible: boolean;
  target: "_self" | "_blank";
};

export type LandingHero = {
  eyebrow: string;
  modalities: string[];
  title: string;
  description: string;
  backgroundUrl: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  highlights: string[];
};

export type LandingMetric = {
  value: string;
  suffix: string;
  label: string;
  visible: boolean;
};

export type LandingAbout = {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  features: string[];
};

export type LandingCampaign = {
  active: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  stats: LandingMetric[];
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type LandingContact = {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  whatsappLabel: string;
  mapLabel: string;
};

export type LandingFooter = {
  legalLinks: LandingNavItem[];
  systemCredit: string;
};

export type LandingSeo = {
  title: string;
  description: string;
};

export type LandingContent = {
  identity: LandingIdentity;
  navigation: LandingNavItem[];
  hero: LandingHero;
  metrics: LandingMetric[];
  about: LandingAbout;
  campaign: LandingCampaign;
  contact: LandingContact;
  footer: LandingFooter;
  seo: LandingSeo;
};

export const defaultLandingContent: LandingContent = {
  identity: {
    officialName: "NexusDojo",
    displayName: "NexusDojo Academy",
    shortName: "NexusDojo",
    slogan: "Jiu-jitsu para todos",
    description:
      "Uma academia preparada para desenvolver tecnica, disciplina e confianca dentro e fora do tatame.",
    logoUrl: "",
    logoLightUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    shareImageUrl: "",
    primaryColor: "#C8102E",
    secondaryColor: "#0B0B0F",
    accentColor: "#F4F4F5",
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    address: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
    mapUrl: "",
    openingHours: "Segunda a sabado",
    legalText: "",
  },
  navigation: [
    { label: "Professores", href: "#professores", visible: true, target: "_self" },
    { label: "Horarios", href: "#horarios", visible: true, target: "_self" },
    { label: "Sobre", href: "#sobre", visible: true, target: "_self" },
    { label: "Campanha", href: "#campanha", visible: true, target: "_self" },
    { label: "Contato", href: "#contato", visible: true, target: "_self" },
  ],
  hero: {
    eyebrow: "Escola de jiu-jitsu",
    modalities: ["Jiu-Jitsu", "No-Gi"],
    title: "A forca que voce procura esta em voce.",
    description:
      "Transforme mente, corpo e espirito atraves da arte suave em um ambiente seguro, tecnico e familiar.",
    backgroundUrl: "",
    primaryCtaLabel: "Agendar aula",
    primaryCtaHref: "#contato",
    secondaryCtaLabel: "Ver horarios",
    secondaryCtaHref: "#horarios",
    highlights: ["Metodologia comprovada", "Ambiente familiar", "Defesa pessoal", "Para todos"],
  },
  metrics: [
    { value: "17", suffix: "h", label: "Treino por semana", visible: true },
    { value: "6", suffix: "", label: "Dias de funcionamento", visible: true },
    { value: "2", suffix: "", label: "Tatames", visible: true },
    { value: "+200", suffix: "", label: "Alunos", visible: true },
  ],
  about: {
    eyebrow: "Nosso legado",
    title: "Um pouco sobre nos",
    body:
      "Mais do que uma escola de luta, somos um ambiente de desenvolvimento pessoal com disciplina, respeito e evolucao constante.",
    imageUrl: "",
    features: [
      "Metodologia estruturada",
      "Ambiente seguro e familiar",
      "Lideranca tecnica",
      "Foco na evolucao do aluno",
    ],
  },
  campaign: {
    active: true,
    eyebrow: "Campanha",
    title: "Menos tela. Mais disciplina.",
    subtitle: "Substitua tempo passivo por movimento, confianca e foco.",
    body:
      "A pratica regular de jiu-jitsu ajuda criancas, jovens e adultos a criarem rotina, autocontrole e condicionamento.",
    imageUrl: "",
    stats: [
      { value: "3 a 6", suffix: "h", label: "de tela por dia podem afetar foco e sono", visible: true },
      { value: "2 a 3", suffix: "h", label: "de treino por semana podem mudar a rotina", visible: true },
    ],
    benefits: ["Foco e concentracao", "Controle emocional", "Qualidade do sono", "Confianca e disciplina"],
    ctaLabel: "Agendar aula experimental",
    ctaHref: "#contato",
  },
  contact: {
    eyebrow: "Fale conosco",
    title: "Estamos te esperando",
    body: "Entre em contato e agende uma aula experimental.",
    imageUrl: "",
    whatsappLabel: "Falar no WhatsApp",
    mapLabel: "Ver localizacao",
  },
  footer: {
    legalLinks: [
      { label: "Privacidade", href: "/privacy", visible: true, target: "_self" },
      { label: "Acesso restrito", href: "/login", visible: true, target: "_self" },
    ],
    systemCredit: "NexusDojo",
  },
  seo: {
    title: "NexusDojo Academy | Jiu-jitsu para todos",
    description: "Academia de jiu-jitsu com aulas para criancas, jovens e adultos.",
  },
};

export function mergeContent(partial?: Partial<Record<keyof LandingContent, Json>> | null): LandingContent {
  if (!partial) return defaultLandingContent;

  return {
    identity: { ...defaultLandingContent.identity, ...(partial.identity as Partial<LandingIdentity> | null) },
    navigation: (partial.navigation as LandingNavItem[] | null) ?? defaultLandingContent.navigation,
    hero: { ...defaultLandingContent.hero, ...(partial.hero as Partial<LandingHero> | null) },
    metrics: (partial.metrics as LandingMetric[] | null) ?? defaultLandingContent.metrics,
    about: { ...defaultLandingContent.about, ...(partial.about as Partial<LandingAbout> | null) },
    campaign: { ...defaultLandingContent.campaign, ...(partial.campaign as Partial<LandingCampaign> | null) },
    contact: { ...defaultLandingContent.contact, ...(partial.contact as Partial<LandingContact> | null) },
    footer: { ...defaultLandingContent.footer, ...(partial.footer as Partial<LandingFooter> | null) },
    seo: { ...defaultLandingContent.seo, ...(partial.seo as Partial<LandingSeo> | null) },
  };
}
