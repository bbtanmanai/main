export interface VideoSection {
  id: string;
  playbackId: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  primaryCta: { label: string; href: string; kind: "internal" | "external" };
  secondaryCta?: { label: string; href: string; kind: "internal" | "external" };
}

export interface CinematicLandingData {
  variant: "cinematic";
  hero: { eyebrow: string; heading: string; subheading: string; cta: string };
  pain: string[];
  proof: { value: string; desc: string };
  videoSections: VideoSection[];
  testimonial: {
    name: string; age: number; region: string;
    income: string; content: string; months: number;
  };
}
