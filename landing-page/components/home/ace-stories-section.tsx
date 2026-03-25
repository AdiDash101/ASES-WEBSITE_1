"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

type Story = {
  avatarSrc: string;
  company: string;
  excerpt: string;
  id: string;
  imageAlt: string;
  imagePosition?: string;
  imageScale?: number;
  imageSrc: string;
  name: string;
  quote: string;
  role: string;
};

const stories: Story[] = [
  {
    id: "john-hacker",
    name: "John Hacker",
    role: "Founder",
    company: "SkillSwap",
    quote:
      "\"ASES taught me that shipping ideas is about failing forward. It gave me the resilience to keep building, and the network to help me learn from every setback.\"",
    excerpt:
      "ASES taught me that shipping ideas is about failing forward. It gave me the resilience to keep building, and the network to help me learn from every setback.",
    imageSrc: "/assets/home/stories/john-overlay.png",
    avatarSrc: "/assets/home/stories/john-overlay.png",
    imageAlt: "An ACE working at a multi-monitor coding setup.",
    imagePosition: "center 48%"
  },
  {
    id: "miguel-torres",
    name: "Miguel Torres",
    role: "CTO",
    company: "LocalBazaar",
    quote:
      "\"The workshops and hackathons at ASES pushed me out of my comfort zone. I learned to code, pitch, and lead a team all within my first year. Now we're helping hundreds of local artisans reach customers nationwide.\"",
    excerpt:
      "The workshops and hackathons at ASES pushed me out of my comfort zone. I learned to code, pitch, and lead a team all within my first year.",
    imageSrc: "/assets/home/projects/localbazaar.jpg",
    avatarSrc: "/assets/home/projects/localbazaar.jpg",
    imageAlt: "A laptop displaying an e-commerce storefront.",
    imagePosition: "center 44%",
    imageScale: 1.08
  },
  {
    id: "angela-reyes",
    name: "Angela Reyes",
    role: "CEO",
    company: "HealthHub PH",
    quote:
      "\"Being part of ASES connected me with incredible mentors and budding startups. Their guidance was invaluable in navigating the complexities of healthcare regulations and scaling our telemedicine platform.\"",
    excerpt:
      "Being part of ASES connected me with incredible mentors and budding startups. Their guidance was invaluable in navigating the complexities of healthcare regulations.",
    imageSrc: "/assets/home/projects/healthhub.jpg",
    avatarSrc: "/assets/home/projects/healthhub.jpg",
    imageAlt: "A roadside electronic sign with a healthcare symbol.",
    imagePosition: "center 52%",
    imageScale: 1.06
  }
];

export function AceStoriesSection() {
  const [activeStoryId, setActiveStoryId] = useState(stories[0]?.id ?? "");
  const prefersReducedMotion = useReducedMotion();

  const activeIndex = useMemo(
    () => stories.findIndex((story) => story.id === activeStoryId),
    [activeStoryId]
  );

  const activeStory = stories[activeIndex] ?? stories[0];

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1] as const
      };

  const setIndex = (nextIndex: number) => {
    const normalizedIndex = (nextIndex + stories.length) % stories.length;
    setActiveStoryId(stories[normalizedIndex]?.id ?? stories[0].id);
  };

  return (
    <section
      aria-labelledby="ace-stories-heading"
      className="ases-stories-section"
      id="stories"
    >
      <div className="ases-container">
        <div className="ases-stories-shell">
          <header className="ases-stories-header">
            <h2 className="ases-stories-title" id="ace-stories-heading">
              ACE Stories
            </h2>
            <p className="ases-stories-subtitle">
              Hear from our ACEs and ASES Alumni
            </p>
          </header>

          <div className="ases-story-feature">
            <div className="ases-story-feature-media">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="ases-story-feature-media-frame"
                  exit={{ opacity: 0, scale: 1.02 }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  key={activeStory.id}
                  transition={transition}
                >
                  <Image
                    alt={activeStory.imageAlt}
                    className="ases-story-feature-image"
                    fill
                    sizes="(min-width: 1280px) 41vw, (min-width: 768px) 50vw, 100vw"
                    src={activeStory.imageSrc}
                    style={
                      {
                        objectPosition: activeStory.imagePosition,
                        transform: `scale(${activeStory.imageScale ?? 1})`
                      } as CSSProperties
                    }
                  />
                  <div
                    aria-hidden="true"
                    className="ases-story-feature-image-gradient"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="ases-story-feature-content">
              <img
                alt=""
                aria-hidden="true"
                className="ases-story-quote-icon"
                src="/assets/icons/stories/quote.svg"
              />

              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="ases-story-feature-copy"
                  exit={{ opacity: 0, y: -14 }}
                  initial={{ opacity: 0, y: 14 }}
                  key={activeStory.id}
                  transition={transition}
                >
                  <p className="ases-story-feature-quote">{activeStory.quote}</p>

                  <div className="ases-story-feature-author">
                    <div aria-hidden="true" className="ases-story-feature-bar" />
                    <div className="ases-story-feature-author-copy">
                      <p className="ases-story-feature-name">{activeStory.name}</p>
                      <p className="ases-story-feature-role">
                        {activeStory.role}, {activeStory.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="ases-story-feature-controls">
                <div
                  aria-label="Story indicators"
                  className="ases-story-dots"
                  role="tablist"
                >
                  {stories.map((story, index) => {
                    const isActive = story.id === activeStory.id;

                    return (
                      <button
                        aria-label={`Show story from ${story.name}`}
                        aria-selected={isActive}
                        className="ases-story-dot"
                        data-active={isActive}
                        key={story.id}
                        onClick={() => {
                          setIndex(index);
                        }}
                        role="tab"
                        type="button"
                      />
                    );
                  })}
                </div>

                <div className="ases-story-arrow-group">
                  <button
                    aria-label="Previous ACE story"
                    className="ases-story-arrow ases-story-arrow-prev"
                    onClick={() => {
                      setIndex(activeIndex - 1);
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                      src="/assets/icons/stories/arrow-left.svg"
                    />
                  </button>

                  <button
                    aria-label="Next ACE story"
                    className="ases-story-arrow ases-story-arrow-next"
                    onClick={() => {
                      setIndex(activeIndex + 1);
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                      src="/assets/icons/stories/arrow-right.svg"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="ases-story-preview-grid">
            {stories.map((story) => {
              const isActive = story.id === activeStory.id;

              return (
                <button
                  className="ases-story-preview-card"
                  data-active={isActive}
                  key={story.id}
                  onClick={() => {
                    setActiveStoryId(story.id);
                  }}
                  type="button"
                >
                  <div className="ases-story-preview-top">
                    <div className="ases-story-preview-avatar">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="ases-story-preview-avatar-image"
                        fill
                        sizes="48px"
                        src={story.avatarSrc}
                      />
                    </div>

                    <div className="ases-story-preview-author">
                      <p className="ases-story-preview-name">{story.name}</p>
                      <p className="ases-story-preview-role">
                        {story.role}, {story.company}
                      </p>
                    </div>
                  </div>

                  <p className="ases-story-preview-copy">{story.excerpt}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
