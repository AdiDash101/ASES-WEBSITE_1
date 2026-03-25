"use client";

import { motion, useReducedMotion } from "framer-motion";
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
        className="relative h-[270px] w-[270px]"
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

function StaticAsesLogo() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className="relative"
        style={{
          height: "max(18.75vw, 26.3671875vh)",
          width: "max(18.75vw, 26.3671875vh)"
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
      </div>
    </div>
  );
}

function SweepShape() {
  return (
    <path
      d={pagePreloaderPaths.wipeFill}
      fill="black"
      transform="translate(-1892 406.5)"
    />
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
      animate={{ x: 1960, y: -1355 }}
      className="pointer-events-none absolute inset-0"
      initial={{ x: -660, y: 150 }}
      transition={{
        delay: prefersReducedMotion ? 0.2 : 2,
        duration: prefersReducedMotion ? 0.6 : 2,
        ease: [0.45, 0, 0.55, 1]
      }}
    >
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
  const sweepTransition = {
    delay: prefersReducedMotion ? 0.2 : 2,
    duration: prefersReducedMotion ? 0.6 : 2,
    ease: [0.45, 0, 0.55, 1] as [number, number, number, number]
  };
  const stageFadeTransition = {
    delay: prefersReducedMotion ? 0.56 : 3.58,
    duration: prefersReducedMotion ? 0.16 : 0.24,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
  };

  return (
    <div className="absolute inset-0 overflow-hidden" data-name="Page Loader">
      <motion.div
        animate={{ opacity: 0 }}
        className="absolute"
        initial={{ opacity: 1 }}
        style={{
          height: 1024,
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          width: 1440
        }}
        transition={stageFadeTransition}
      >
        <svg
          className="absolute inset-0 block h-full w-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1440 1024"
        >
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id="preloader-stage-red-gradient"
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
              id="preloader-stage-dot-pattern"
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
            <mask id="preloader-stage-reveal-mask">
              <rect fill="white" height="1024" width="1440" x="0" y="0" />
              <motion.g
                animate={{ x: 1960, y: -1355 }}
                initial={{ x: -660, y: 150 }}
                transition={sweepTransition}
              >
                <SweepShape />
              </motion.g>
            </mask>
          </defs>

          <g mask="url(#preloader-stage-reveal-mask)">
            <path d="M1440 1024H0V0H1440V1024Z" fill="#FF2C07" />
            <path
              d="M1440 1024H0V0H1440V1024Z"
              fill="url(#preloader-stage-dot-pattern)"
              style={{ mixBlendMode: "multiply" }}
            />
            <path
              d="M1440 1024H0V0H1440V1024Z"
              fill="url(#preloader-stage-red-gradient)"
              fillOpacity="0.36"
            />

            <g transform="translate(585 377)">
              <motion.g
                animate={{ rotate: 360 }}
                initial={{ rotate: 0 }}
                style={{
                  transformOrigin: "135px 135px"
                }}
                transition={{
                  duration: prefersReducedMotion ? 0.4 : 2.5,
                  ease: [0.45, 0, 0.55, 1]
                }}
              >
                <path d={pagePreloaderPaths.logo} fill="white" />
              </motion.g>
            </g>
          </g>
        </svg>

        <AnimatedSweep prefersReducedMotion={prefersReducedMotion} />
      </motion.div>
    </div>
  );
}

export function PagePreloader() {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion ?? false;
  const [hasMounted, setHasMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const hideDelay = shouldReduceMotion ? 780 : 3920;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const cleanupTimer = window.setTimeout(() => {
      setIsVisible(false);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    }, hideDelay);

    return () => {
      window.clearTimeout(cleanupTimer);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [hasMounted, shouldReduceMotion]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {hasMounted ? (
        <AnimatedPageLoader prefersReducedMotion={shouldReduceMotion} />
      ) : (
        <div
          className="absolute inset-0 overflow-hidden"
          data-name="Page Loader Placeholder"
        >
          <RedBackground />
          <StaticAsesLogo />
        </div>
      )}
      <span className="sr-only" role="status">
        Loading ASES Manila
      </span>
    </div>
  );
}
