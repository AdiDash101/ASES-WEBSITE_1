"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";

type GalleryCard = {
  alt: string;
  baseZ: number;
  id: string;
  imagePosition: string;
  imageScale?: number;
  layoutClassName: string;
  rotation: number;
  src: string;
};

const galleryCards: GalleryCard[] = [
  {
    id: "discussion-circle",
    src: "/assets/home/social-gallery/discussion-circle.jpg",
    alt: "ASES Manila members seated in a discussion circle.",
    imagePosition: "48% 50%",
    layoutClassName:
      "left-[-3.5%] top-[23%] w-[32%] sm:left-[-1%] sm:top-[16.5%] sm:w-[28.5%] md:left-[0%] md:top-[12.5%] md:w-[25.46%] lg:top-[15.5%]",
    rotation: -8.57,
    baseZ: 1
  },
  {
    id: "community-crowd",
    src: "/assets/home/social-gallery/community-crowd.jpg",
    alt: "ASES Manila community photo taken in a packed room.",
    imagePosition: "50% 52%",
    layoutClassName:
      "left-[12.5%] top-[8%] w-[33.5%] sm:left-[16%] sm:top-[5%] sm:w-[29%] md:left-[18.7%] md:top-[1.75%] md:w-[25.44%] lg:left-[19.1%] lg:top-[4.5%]",
    rotation: -6.43,
    baseZ: 2
  },
  {
    id: "ases-blue-shirt",
    src: "/assets/home/social-gallery/ases-blue-shirt.jpg",
    alt: "ASES Manila members smiling and showing tokens to the camera.",
    imagePosition: "81% 3%",
    imageScale: 1.72,
    layoutClassName:
      "left-[31%] top-[-1%] w-[37%] sm:left-[35%] sm:top-[-3.5%] sm:w-[31%] md:left-[37.35%] md:top-[-1.75%] md:w-[25.43%] lg:top-[0.5%]",
    rotation: 0,
    baseZ: 5
  },
  {
    id: "panel-session",
    src: "/assets/home/social-gallery/panel-session.jpg",
    alt: "ASES Manila attendees listening to a panel session.",
    imagePosition: "52% 50%",
    layoutClassName:
      "left-[54%] top-[8%] w-[33.5%] sm:left-[56%] sm:top-[5%] sm:w-[29%] md:left-[55.85%] md:top-[1.75%] md:w-[25.44%] lg:left-[53.02%] lg:top-[4.5%]",
    rotation: 6.43,
    baseZ: 2
  },
  {
    id: "workshop-room",
    src: "/assets/home/social-gallery/workshop-room.jpg",
    alt: "ASES Manila members gathered inside a workshop room.",
    imagePosition: "55% 48%",
    layoutClassName:
      "left-[71%] top-[23%] w-[32%] sm:left-[72.5%] sm:top-[16.5%] sm:w-[28.5%] md:left-[74.54%] md:top-[12.5%] md:w-[25.46%] lg:top-[15.5%]",
    rotation: 8.57,
    baseZ: 1
  }
];

function isGalleryCardTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest("[data-gallery-card]");
}

function getCardState(
  card: GalleryCard,
  index: number,
  activeIndex: number | null
) {
  const baseState = {
    filter:
      index === 2
        ? "saturate(1.02) brightness(1.02)"
        : "saturate(0.94) brightness(0.96)",
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

export function SocialGallerySection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
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
    <section className="ases-social-gallery-section" id="socials">
      <div className="ases-container">
        <div
          className="ases-social-gallery-shell"
          onBlur={(event) => {
            const nextTarget = event.relatedTarget;

            if (
              !nextTarget ||
              !event.currentTarget.contains(nextTarget as Node)
            ) {
              setActiveIndex(null);
            }
          }}
          onPointerLeave={() => {
            setActiveIndex(null);
          }}
        >
          <div className="ases-social-gallery-stage">
            {galleryCards.map((card, index) => {
              const isInteractive = activeIndex !== null;
              const state = getCardState(card, index, activeIndex);

              return (
                <motion.article
                  aria-label={card.alt}
                  className={`ases-social-gallery-card ${card.layoutClassName}`}
                  data-active={activeIndex === index}
                  data-gallery-card="true"
                  data-dimmed={isInteractive && activeIndex !== index}
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
                    if (!isGalleryCardTarget(event.relatedTarget)) {
                      setActiveIndex(null);
                    }
                  }}
                  style={{
                    zIndex: state.zIndex
                  }}
                  tabIndex={0}
                  transition={cardTransition}
                >
                  <span aria-hidden="true" className="ases-social-gallery-card-frame">
                    <motion.span
                      className="ases-social-gallery-card-media"
                      animate={{
                        filter: state.filter,
                        scale: state.mediaScale
                      }}
                      style={{
                        transformOrigin: card.imagePosition
                      }}
                      transition={mediaTransition}
                    >
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="ases-social-gallery-card-image"
                        fill
                        priority={index === 2}
                        sizes="(min-width: 1280px) 21vw, (min-width: 768px) 26vw, 38vw"
                        src={card.src}
                        style={{
                          objectPosition: card.imagePosition
                        }}
                      />
                    </motion.span>
                    <motion.span
                      aria-hidden="true"
                      className="ases-social-gallery-card-overlay"
                      animate={{
                        opacity: state.overlayOpacity
                      }}
                      transition={overlayTransition}
                    />
                  </span>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
