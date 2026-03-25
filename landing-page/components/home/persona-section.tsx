"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

type Persona = {
  accent: string;
  body: string;
  id: string;
  imageAlt: string;
  imageSrc: string;
  intro: string;
  label: string;
  outro: string;
};

const personas: Persona[] = [
  {
    id: "hacker",
    label: "Hacker",
    accent: "#64B4FF",
    imageSrc: "/assets/home/personas/hacker.jpg",
    imageAlt: "ASES Manila members listening to a session.",
    intro: "You don't wait for the perfect conditions, you open your laptop and start.",
    body:
      "You've broken more things than you can count, and that's exactly why you know how to build them better.",
    outro:
      "Whether it's a side project, a prototype, or a full product, you ship first and refine later."
  },
  {
    id: "hipster",
    label: "Hipster",
    accent: "#40D2C8",
    imageSrc: "/assets/home/personas/hipster.jpg",
    imageAlt: "ASES Manila members posing with tokens for the camera.",
    intro: "You see the world differently, literally.",
    body:
      "Where others see a problem, you see a story waiting to be told.",
    outro:
      "You're the one who makes a startup feel human, a product feel intuitive, and an idea feel worth believing in. You shape how people feel before they even know what they think."
  },
  {
    id: "hustler",
    label: "Hustler",
    accent: "#64DCA0",
    imageSrc: "/assets/home/personas/hustler.jpg",
    imageAlt: "ASES Manila members networking during a session.",
    intro: "You're not waiting for the right moment, you're creating it.",
    body:
      "You see the gap between a great product and a great business, and you know how to close it.",
    outro:
      "You build relationships, open doors, and make things move when everyone else is still planning."
  }
] as const;

export function PersonaSection() {
  const [activePersonaId, setActivePersonaId] = useState<(typeof personas)[number]["id"]>("hacker");
  const prefersReducedMotion = useReducedMotion();

  const activePersona = useMemo(
    () => personas.find((persona) => persona.id === activePersonaId) ?? personas[0],
    [activePersonaId]
  );

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1] as const
      };

  return (
    <section className="ases-persona-section" id="personas">
      <div className="ases-container">
        <div className="ases-persona-shell">
          <header className="ases-persona-header">
            <h2 className="ases-persona-title">Are you a...</h2>

            <div
              aria-label="Persona selector"
              className="ases-persona-pill-list"
              role="tablist"
            >
              {personas.map((persona) => {
                const isActive = persona.id === activePersona.id;

                return (
                  <button
                    aria-selected={isActive}
                    className="ases-persona-pill"
                    data-active={isActive}
                    key={persona.id}
                    onClick={() => {
                      setActivePersonaId(persona.id);
                    }}
                    role="tab"
                    style={
                      {
                        "--persona-accent": persona.accent
                      } as CSSProperties
                    }
                    type="button"
                  >
                    {persona.id}
                  </button>
                );
              })}
            </div>
          </header>

          <div
            className="ases-persona-card"
            style={
              {
                "--persona-accent": activePersona.accent
              } as CSSProperties
            }
          >
            <motion.div
              animate={{
                backgroundColor: activePersona.accent
              }}
              className="ases-persona-rail"
              transition={transition}
            />

            <div className="ases-persona-card-copy">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="ases-persona-copy-stack"
                  exit={{ opacity: 0, y: -14 }}
                  initial={{ opacity: 0, y: 14 }}
                  key={activePersona.id}
                  transition={transition}
                >
                  <motion.div
                    animate={{
                      backgroundColor: activePersona.accent
                    }}
                    className="ases-persona-sticker"
                    transition={transition}
                  >
                    <span>{activePersona.label}</span>
                  </motion.div>

                  <div className="ases-persona-copy-block">
                    <p className="ases-persona-copy-muted">{activePersona.intro}</p>
                    <p className="ases-persona-copy-strong">{activePersona.body}</p>
                    <p className="ases-persona-copy-muted">{activePersona.outro}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="ases-persona-card-media">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="ases-persona-media-frame"
                  exit={{ opacity: 0, scale: 1.02 }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  key={activePersona.id}
                  transition={transition}
                >
                  <Image
                    alt={activePersona.imageAlt}
                    className="ases-persona-image"
                    fill
                    sizes="(min-width: 1280px) 28vw, (min-width: 768px) 36vw, 100vw"
                    src={activePersona.imageSrc}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
