"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type FinalEmphasisWord = {
  colorClassName: string;
  label: string;
};

type FinalGalleryCard = {
  alt: string;
  baseZ: number;
  id: string;
  imagePosition: string;
  imageScale?: number;
  layoutClassName: string;
  rotation: number;
  src: string;
};

const finalEmphasisWords: FinalEmphasisWord[] = [
  {
    label: "build",
    colorClassName: "ases-hero-sticker-frame-build"
  },
  {
    label: "design",
    colorClassName: "ases-hero-sticker-frame-design"
  },
  {
    label: "scale",
    colorClassName: "ases-hero-sticker-frame-scale"
  }
];

const finalGalleryCards: FinalGalleryCard[] = [
  {
    id: "finale-outer-left",
    src: "/assets/home/finale/photo-2.jpg",
    alt: "ASES Manila members gathered in a small group.",
    imagePosition: "center 50%",
    layoutClassName:
      "left-[-2%] top-[23%] w-[28%] sm:left-[2%] sm:top-[20%] sm:w-[24.5%] md:left-[7.5%] md:top-[17%] md:w-[21.5%] lg:left-[12.5%] lg:top-[20%] lg:w-[18.75%]",
    rotation: -8.57,
    baseZ: 1
  },
  {
    id: "finale-inner-left",
    src: "/assets/home/finale/photo-1.jpg",
    alt: "ASES Manila member smiling during an event.",
    imagePosition: "center 48%",
    layoutClassName:
      "left-[10.5%] top-[8%] w-[29.5%] sm:left-[17%] sm:top-[5%] sm:w-[25.5%] md:left-[24%] md:top-[5%] md:w-[22%] lg:left-[23.8%] lg:top-[7%] lg:w-[19.25%]",
    rotation: -6.43,
    baseZ: 2
  },
  {
    id: "finale-center",
    src: "/assets/home/finale/photo-5.jpg",
    alt: "ASES Manila members seated together during a session.",
    imagePosition: "center 48%",
    imageScale: 1.02,
    layoutClassName:
      "left-[28%] top-[0%] w-[32.5%] sm:left-[36%] sm:top-[-1%] sm:w-[28%] md:left-[43.5%] md:top-[0%] md:w-[23.5%] lg:left-[40.9%] lg:top-[0%] lg:w-[19.9%]",
    rotation: 0,
    baseZ: 5
  },
  {
    id: "finale-inner-right",
    src: "/assets/home/finale/photo-4.jpg",
    alt: "ASES Manila member speaking inside a room.",
    imagePosition: "center 50%",
    layoutClassName:
      "left-[52%] top-[8%] w-[29.5%] sm:left-[56%] sm:top-[5%] sm:w-[25.5%] md:left-[54%] md:top-[5%] md:w-[22%] lg:left-[57.1%] lg:top-[7%] lg:w-[19.25%]",
    rotation: 6.43,
    baseZ: 2
  },
  {
    id: "finale-outer-right",
    src: "/assets/home/finale/photo-3.jpg",
    alt: "ASES Manila members smiling together indoors.",
    imagePosition: "center 50%",
    layoutClassName:
      "left-[74%] top-[23%] w-[28%] sm:left-[74.5%] sm:top-[20%] sm:w-[24.5%] md:left-[71.2%] md:top-[17%] md:w-[21.5%] lg:left-[68.7%] lg:top-[20%] lg:w-[18.75%]",
    rotation: 8.57,
    baseZ: 1
  }
];

function isFinalGalleryCardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest("[data-finale-gallery-card]")
  );
}

function getFinalGalleryCardState(
  card: FinalGalleryCard,
  index: number,
  activeIndex: number | null
) {
  const baseState = {
    filter:
      index === 2
        ? "saturate(1.02) brightness(1.02)"
        : "saturate(0.94) brightness(0.97)",
    mediaScale: card.imageScale ?? 1,
    overlayOpacity: index === 2 ? 0.02 : 0.1,
    rotate: card.rotation,
    scale: index === 2 ? 1.01 : 1,
    shadowFilter:
      "drop-shadow(0 14px 18px rgba(11, 23, 36, 0.14)) drop-shadow(0 24px 34px rgba(11, 23, 36, 0.12))",
    x: 0,
    y: index === 2 ? -12 : 0,
    zIndex: card.baseZ
  };

  if (activeIndex === null) {
    return baseState;
  }

  if (activeIndex === index) {
    return {
      ...baseState,
      filter: "saturate(1.05) brightness(1.02)",
      mediaScale: (card.imageScale ?? 1) + 0.035,
      overlayOpacity: 0.03,
      rotate:
        card.rotation === 0
          ? 0
          : card.rotation + (card.rotation > 0 ? -2.2 : 2.2),
      scale: 1.045,
      shadowFilter:
        "drop-shadow(0 18px 24px rgba(10, 42, 56, 0.16)) drop-shadow(0 34px 54px rgba(10, 42, 56, 0.18))",
      y: -32,
      zIndex: 20
    };
  }

  const distance = Math.abs(index - activeIndex);
  const direction = Math.sign(index - activeIndex);
  const spread = Math.min(distance, 2);

  return {
    ...baseState,
    filter:
      spread === 1
        ? "saturate(0.9) brightness(0.92)"
        : "saturate(0.82) brightness(0.86)",
    mediaScale: Math.max(
      0.92,
      (card.imageScale ?? 1) - (spread === 1 ? 0.015 : 0.03)
    ),
    overlayOpacity: spread === 1 ? 0.16 : 0.22,
    rotate: card.rotation + direction * (spread === 1 ? 5.4 : 8.2),
    scale: spread === 1 ? 0.978 : 0.958,
    shadowFilter:
      spread === 1
        ? "drop-shadow(0 12px 16px rgba(10, 42, 56, 0.12)) drop-shadow(0 20px 28px rgba(10, 42, 56, 0.1))"
        : "drop-shadow(0 10px 14px rgba(10, 42, 56, 0.1)) drop-shadow(0 16px 24px rgba(10, 42, 56, 0.09))",
    x: direction * (spread === 1 ? 52 : 96),
    y: spread === 1 ? 22 : 36,
    zIndex: card.baseZ
  };
}

export function FinalCtaSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const activeWord = finalEmphasisWords[activeWordIndex];

  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveWordIndex(0);

      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveWordIndex((previousIndex) => {
        return (previousIndex + 1) % finalEmphasisWords.length;
      });
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [prefersReducedMotion]);

  const stickerTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : {
            opacity: {
              duration: 0.24,
              ease: [0.22, 1, 0.36, 1]
            },
            scale: {
              type: "spring" as const,
              stiffness: 210,
              damping: 18,
              mass: 0.9
            },
            y: {
              type: "spring" as const,
              stiffness: 205,
              damping: 19,
              mass: 0.92
            }
          },
    [prefersReducedMotion]
  );

  const cardTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : {
            filter: {
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1]
            },
            opacity: {
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1]
            },
            rotate: {
              type: "spring" as const,
              stiffness: 118,
              damping: 18,
              mass: 1.02
            },
            scale: {
              type: "spring" as const,
              stiffness: 154,
              damping: 18,
              mass: 0.92
            },
            x: {
              type: "spring" as const,
              stiffness: 124,
              damping: 18,
              mass: 1.04
            },
            y: {
              type: "spring" as const,
              stiffness: 124,
              damping: 18,
              mass: 1.06
            }
          },
    [prefersReducedMotion]
  );

  const mediaTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : {
            filter: {
              duration: 0.42,
              ease: [0.22, 1, 0.36, 1]
            },
            scale: {
              type: "spring" as const,
              stiffness: 132,
              damping: 19,
              mass: 0.96
            }
          },
    [prefersReducedMotion]
  );

  const overlayTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : {
            opacity: {
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1]
            }
          },
    [prefersReducedMotion]
  );

  return (
    <section className="ases-finale-section" id="become-an-ace">
      <div className="ases-container">
        <div className="ases-finale-shell">
          <div className="ases-finale-copy">
            <h2 className="ases-finale-heading">
              <span className="ases-finale-heading-top">
                <span className="ases-finale-heading-word">We</span>
                <span className="sr-only">build, design, or scale</span>
                <span aria-hidden="true" className="ases-finale-sticker">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0
                      }}
                      className={`ases-finale-sticker-frame ${activeWord.colorClassName}`}
                      exit={
                        prefersReducedMotion
                          ? {
                              opacity: 0
                            }
                          : {
                              opacity: 0,
                              scale: 1.015,
                              y: -10
                            }
                      }
                      initial={
                        prefersReducedMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.96,
                              y: 12
                            }
                      }
                      key={activeWord.label}
                      transition={stickerTransition}
                    >
                      {activeWord.label}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>

              <span className="ases-finale-heading-tail">
                greater things together.
              </span>
            </h2>

            <p className="ases-finale-subcopy">
              Become an ACE, and bring that vision to life with ASES Manila.
            </p>

            <div className="ases-finale-actions">
              <button className="ases-finale-cta" type="button">
                <span>Join as a Member</span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-3.5 w-3.5 brightness-0 invert"
                  src="/assets/icons/arrow-up-right.svg"
                />
              </button>

              <a className="ases-finale-link" href="#about">
                Learn More
              </a>
            </div>
          </div>

          <div
            className="ases-finale-gallery"
            onBlur={(event) => {
              const nextTarget = event.relatedTarget;

              if (!nextTarget || !event.currentTarget.contains(nextTarget as Node)) {
                setActiveIndex(null);
              }
            }}
            onPointerLeave={() => {
              setActiveIndex(null);
            }}
          >
            <div className="ases-finale-gallery-stage">
              {finalGalleryCards.map((card, index) => {
                const isInteractive = activeIndex !== null;
                const state = getFinalGalleryCardState(card, index, activeIndex);

                return (
                  <motion.article
                    aria-label={card.alt}
                    className={`ases-finale-gallery-card ${card.layoutClassName}`}
                    data-active={activeIndex === index}
                    data-dimmed={isInteractive && activeIndex !== index}
                    data-finale-gallery-card="true"
                    initial={
                      prefersReducedMotion
                        ? false
                        : {
                            opacity: 0,
                            scale: 0.96,
                            x: 0,
                            y: state.y + 28,
                            rotate: state.rotate
                          }
                    }
                    key={card.id}
                    layout="position"
                    animate={{
                      filter: state.shadowFilter,
                      opacity: 1,
                      rotate: state.rotate,
                      scale: state.scale,
                      x: state.x,
                      y: state.y
                    }}
                    onFocus={() => {
                      setActiveIndex(index);
                    }}
                    onPointerEnter={() => {
                      setActiveIndex(index);
                    }}
                    onPointerLeave={(event) => {
                      if (!isFinalGalleryCardTarget(event.relatedTarget)) {
                        setActiveIndex(null);
                      }
                    }}
                    style={{
                      zIndex: state.zIndex
                    }}
                    tabIndex={0}
                    transition={cardTransition}
                  >
                    <span aria-hidden="true" className="ases-finale-gallery-card-frame">
                      <motion.span
                        animate={{
                          filter: state.filter,
                          scale: state.mediaScale
                        }}
                        className="ases-finale-gallery-card-media"
                        style={{
                          transformOrigin: card.imagePosition
                        }}
                        transition={mediaTransition}
                      >
                        <Image
                          alt=""
                          aria-hidden="true"
                          className="ases-finale-gallery-image"
                          fill
                          priority={index === 2}
                          sizes="(min-width: 1280px) 19vw, (min-width: 768px) 22vw, 32vw"
                          src={card.src}
                          style={{
                            objectPosition: card.imagePosition
                          }}
                        />
                      </motion.span>
                      <motion.span
                        animate={{
                          opacity: state.overlayOpacity
                        }}
                        aria-hidden="true"
                        className="ases-finale-gallery-overlay"
                        transition={overlayTransition}
                      />
                    </span>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
