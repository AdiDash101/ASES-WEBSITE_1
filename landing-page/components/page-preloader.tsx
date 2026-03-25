"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";

import pagePreloaderPaths from "@/components/page-preloader-paths";

function getViewportScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  const widthScale = window.innerWidth / 1440;
  const heightScale = window.innerHeight / 1024;

  return Math.max(widthScale, heightScale);
}

function useViewportScale() {
  const [scale, setScale] = useState(getViewportScale);

  useLayoutEffect(() => {
    const updateScale = () => {
      setScale(getViewportScale());
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return scale;
}

function RedBackground() {
  return (
    <div className="absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 1024"
      >
        <path d="M1440 1024H0V0H1440V1024Z" fill="#FF2C07" />
        <path
          d="M1440 1024H0V0H1440V1024Z"
          fill="url(#preloader-dot-pattern)"
          style={{ mixBlendMode: "multiply" }}
        />
        <path
          d="M1440 1024H0V0H1440V1024Z"
          fill="url(#preloader-red-gradient)"
          fillOpacity="0.36"
        />
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="preloader-red-gradient"
            x1="720"
            x2="720"
            y1="0"
            y2="1024"
          >
            <stop stopColor="#EB4329" />
            <stop offset="1" stopColor="#8D1806" />
          </linearGradient>
          <pattern
            height="1"
            id="preloader-dot-pattern"
            patternTransform="matrix(56.64 0 0 55.68 0 0)"
            patternUnits="userSpaceOnUse"
            preserveAspectRatio="none"
            viewBox="0 0 236 232"
            width="1"
          >
            <rect fill="#F8F8F8" height="232" width="236" />
            <circle cx="170" cy="63" fill="white" r="30" />
            <circle cx="170" cy="170" fill="white" r="30" />
            <circle cx="65" cy="63" fill="white" r="30" />
            <circle cx="65" cy="170" fill="white" r="30" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}

function AsesLogo({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        className="relative h-[clamp(9rem,18vw,16.875rem)] w-[clamp(9rem,18vw,16.875rem)]"
        initial={{ rotate: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.4 : 2.5,
          ease: [0.45, 0, 0.55, 1]
        }}
      >
        <svg
          className="absolute block h-full w-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 270 270"
        >
          <path d={pagePreloaderPaths.logo} fill="white" />
        </svg>
      </motion.div>
    </div>
  );
}

function SweepShape() {
  return (
    <div
      className="absolute"
      style={{
        height: "2195.5px",
        left: "-1892px",
        top: "406.5px",
        width: "2584.296px"
      }}
    >
      <svg
        className="absolute block h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 2586.34 2196.1"
      >
        <path d={pagePreloaderPaths.wipeFill} fill="white" />
      </svg>
    </div>
  );
}

function AceShape() {
  return (
    <div
      className="absolute"
      style={{
        height: "397.298px",
        left: "-621.7px",
        top: "900px",
        width: "608.503px"
      }}
    >
      <div
        className="absolute"
        style={{ inset: "-3.27% -2.14% -2.77% -1.81%" }}
      >
        <svg
          className="block h-full w-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 632.504 421.299"
        >
          <path
            d={pagePreloaderPaths.aceOutline}
            fill="#3F439C"
            stroke="white"
            strokeLinejoin="round"
            strokeWidth="13"
          />
          <path d={pagePreloaderPaths.aceFillA} fill="#EB4329" />
          <path d={pagePreloaderPaths.aceFillB} fill="#EB4329" />
          <path
            d={pagePreloaderPaths.aceStroke}
            fill="none"
            stroke="white"
            strokeLinejoin="round"
            strokeWidth="22"
          />
        </svg>
      </div>
    </div>
  );
}

function AnimatedSweep({
  prefersReducedMotion
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      animate={{ x: 1964, y: -1405 }}
      className="pointer-events-none absolute inset-0"
      initial={{ x: 100, y: 100 }}
      transition={{
        delay: prefersReducedMotion ? 0.2 : 2,
        duration: prefersReducedMotion ? 0.6 : 2,
        ease: [0.45, 0, 0.55, 1]
      }}
    >
      <SweepShape />
      <AceShape />
    </motion.div>
  );
}

function AnimatedPageLoader({
  prefersReducedMotion
}: {
  prefersReducedMotion: boolean;
}) {
  const scale = useViewportScale();

  return (
    <div className="absolute inset-0 overflow-hidden" data-name="Page Loader">
      <motion.div
        animate={{ opacity: 0 }}
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        transition={{
          delay: prefersReducedMotion ? 0.45 : 3,
          duration: prefersReducedMotion ? 0.28 : 1,
          ease: "easeInOut"
        }}
      >
        <RedBackground />
        <div
          className="absolute"
          style={{
            height: 1024,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            width: 1440
          }}
        >
          <AsesLogo prefersReducedMotion={prefersReducedMotion} />
        </div>
      </motion.div>

      <div
        className="absolute"
        style={{
          height: 1024,
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          width: 1440
        }}
      >
        <AnimatedSweep prefersReducedMotion={prefersReducedMotion} />
      </div>
    </div>
  );
}

export function PagePreloader() {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion ?? false;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    }, shouldReduceMotion ? 1100 : 4300);

    return () => {
      window.clearTimeout(timeout);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [shouldReduceMotion]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-white"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.12 : 0.2 }}
        >
          <AnimatedPageLoader prefersReducedMotion={shouldReduceMotion} />
          <span className="sr-only" role="status">
            Loading ASES Manila
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
