import { AboutSection } from "@/components/home/about-section";
import { HeroSection } from "@/components/home/hero-section";
import { PartnersSection } from "@/components/home/partners-section";
import { PersonaSection } from "@/components/home/persona-section";
import { SocialGallerySection } from "@/components/home/social-gallery-section";
import { Navbar } from "@/components/navigation/navbar";

const colorTokens = [
  {
    name: "Brand Red",
    className: "bg-brand-red",
    value: "#FF2C07",
    usage: "Primary CTA, links, event tags"
  },
  {
    name: "Deep Iris",
    className: "bg-brand-iris-deep",
    value: "#251E73",
    usage: "Footer fade, brand depth"
  },
  {
    name: "Iris",
    className: "bg-brand-iris",
    value: "#3F439C",
    usage: "Support accents and contrast blocks"
  },
  {
    name: "Pastel Iris",
    className: "bg-brand-iris-soft",
    value: "#97B6F8",
    usage: "Glow washes and section highlights"
  },
  {
    name: "Sky Accent",
    className: "bg-brand-sky",
    value: "#64B4FF",
    usage: "Sticker emphasis and active states"
  },
  {
    name: "Canvas",
    className: "bg-canvas",
    value: "#FFFFFF",
    usage: "Primary page surface"
  }
] as const;

const typeTokens = [
  {
    name: "Display",
    sample: "Anyone can build,",
    className: "ases-display max-w-[12ch]",
    note: "Hero headlines and section lockups"
  },
  {
    name: "Section",
    sample: "Flagship Events & Initiatives",
    className: "ases-heading max-w-[18ch]",
    note: "Main section titles"
  },
  {
    name: "Title",
    sample: "Student Venture Program",
    className: "font-display text-title text-ink",
    note: "Card titles and story headings"
  },
  {
    name: "Body",
    sample:
      "Use supportive copy to explain the community, builder journey, and social proof without overpowering the display type.",
    className: "max-w-copy text-body text-muted",
    note: "Longform supporting copy"
  },
  {
    name: "Meta",
    sample: "Previously partnered with",
    className: "font-sans text-label uppercase tracking-[0.08em] text-muted",
    note: "Labels, chips, and minor navigation"
  }
] as const;

const systemRules = [
  "Build sections against semantic token classes first, then add one-off layout values only when the design genuinely needs them.",
  "Keep the white editorial canvas, subtle grid texture, and red-blue accent balance from the Figma file.",
  "Use Cocogoose for hero, headings, buttons, and high-emphasis labels. Keep Inter-style sans copy for support text and footer content.",
  "Preserve collage energy later with rotated frames and layered media instead of flattening the composition into a standard card grid."
] as const;

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="pb-20">
        <HeroSection />
        <SocialGallerySection />
        <PartnersSection />
        <PersonaSection />
        <AboutSection />

        <section className="ases-section pt-0" id="events">
          <div className="ases-container grid gap-10 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="space-y-4">
              <span className="ases-kicker">Palette</span>
              <h2 className="ases-heading max-w-[10ch]">Brand colors</h2>
              <p className="ases-copy">
                These map directly to Figma variables plus the recurring
                sky-blue accent used in emphasis stickers and active controls.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {colorTokens.map((token) => (
                <article className="ases-card overflow-hidden" key={token.name}>
                  <div className={`h-28 w-full ${token.className}`} />
                  <div className="space-y-2 p-frame">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-title text-ink">
                        {token.name}
                      </h3>
                      <span className="font-sans text-xs uppercase tracking-[0.08em] text-muted">
                        {token.value}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted">
                      {token.usage}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ases-section pt-0" id="become-an-ace">
          <div className="ases-container grid gap-10 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4">
              <span className="ases-kicker">Type</span>
              <h2 className="ases-heading max-w-[11ch]">Typography scale</h2>
              <p className="ases-copy">
                Cocogoose carries the visual punch. Sans copy stays quieter and
                cleaner so the display moments keep their edge.
              </p>
            </div>
            <div className="space-y-4">
              {typeTokens.map((token) => (
                <article className="ases-card-soft p-frame" key={token.name}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-display text-label uppercase text-brand-red">
                      {token.name}
                    </span>
                    <span className="font-sans text-xs uppercase tracking-[0.08em] text-muted">
                      {token.note}
                    </span>
                  </div>
                  <p className={token.className}>{token.sample}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ases-section pt-0">
          <div className="ases-container grid gap-10 xl:grid-cols-[0.76fr_1.24fr]">
            <div className="space-y-4">
              <span className="ases-kicker">Primitives</span>
              <h2 className="ases-heading max-w-[10ch]">Reusable UI pieces</h2>
              <p className="ases-copy">
                The goal is to make future sections composable from a few strong
                pieces instead of rewriting styles per component.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="ases-card p-frame">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="font-display text-title text-ink">Buttons</h3>
                  <span className="ases-token-chip">pill radius</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="ases-button-primary" type="button">
                    Join as a Member
                  </button>
                  <button className="ases-button-secondary" type="button">
                    Learn More
                  </button>
                </div>
              </article>

              <article className="ases-card p-frame">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="font-display text-title text-ink">
                    Surfaces
                  </h3>
                  <span className="ases-token-chip">rounded + shadowed</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="ases-card-soft p-4">
                    <div className="mb-3 h-1.5 w-14 rounded-pill bg-brand-sky" />
                    <p className="font-display text-label text-ink">
                      Story card
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Soft white surface with floating depth.
                    </p>
                  </div>
                  <div className="rounded-card border border-dashed border-brand-red bg-brand-red-wash p-4">
                    <p className="font-display text-label text-brand-red">
                      Accent panel
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      Use sparingly for callouts, stats, and event tags.
                    </p>
                  </div>
                </div>
              </article>

              <article className="ases-card relative overflow-hidden p-frame lg:col-span-2">
                <div className="absolute inset-x-0 top-0 h-28 bg-footer-fade opacity-90" />
                <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <span className="ases-token-chip">section shell</span>
                    <h3 className="font-display text-title text-ink">
                      Layout guidance
                    </h3>
                    <p className="text-sm leading-6 text-muted">
                      Use the container and section primitives for base rhythm,
                      then introduce the collage-specific rotations and overlaps
                      at the component level.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="ases-stat">
                      <span className="font-display text-[2rem] leading-none tracking-display text-brand-red">
                        section
                      </span>
                      <p className="text-sm text-muted">
                        Vertical rhythm token for major blocks
                      </p>
                    </div>
                    <div className="ases-stat">
                      <span className="font-display text-[2rem] leading-none tracking-display text-brand-iris">
                        gutter
                      </span>
                      <p className="text-sm text-muted">
                        Shared page padding and max-width control
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="ases-section pt-0">
          <div className="ases-container">
            <div className="ases-card p-frame">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="ases-kicker">Build rules</span>
                  <h2 className="font-display text-title text-ink">
                    Implementation guardrails
                  </h2>
                </div>
                <span className="ases-token-chip">
                  see agents.md for scope
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {systemRules.map((rule) => (
                  <article className="ases-card-soft p-4" key={rule}>
                    <p className="text-sm leading-6 text-ink-soft">{rule}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
