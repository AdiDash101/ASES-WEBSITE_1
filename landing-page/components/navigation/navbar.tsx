"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "#about", label: "About" },
  { href: "#events", label: "Events" }
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="ases-navbar">
      <div className="ases-navbar-surface">
        <div className="ases-navbar-inner">
          <Link
            aria-label="ASES Manila home"
            className="relative block h-[30px] w-[90px] shrink-0 overflow-hidden sm:h-[33px] sm:w-[99px]"
            href="/"
            onClick={closeMenu}
          >
            <img
              alt="ASES Manila"
              className="absolute max-w-none invert select-none"
              src="/assets/brand/ases/logo-lockup.png"
              style={{
                height: "343.94%",
                left: "-6.83%",
                top: "-121.77%",
                width: "114.73%"
              }}
            />
          </Link>

          <nav aria-label="Primary" className="ases-navbar-links">
            {primaryLinks.map((link) => (
              <Link
                className="ases-nav-link"
                href={link.href}
                key={link.label}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            <Link
              className="ases-nav-link-cta"
              href="#become-an-ace"
              onClick={closeMenu}
            >
              <span>Become an ACE</span>
              <img
                alt=""
                aria-hidden="true"
                className="h-[10.72px] w-[10px] shrink-0"
                src="/assets/icons/arrow-up-right.svg"
              />
            </Link>
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="ases-navbar-toggle"
            onClick={() => {
              setIsOpen((open) => !open);
            }}
            type="button"
          >
            <span
              className={`ases-navbar-toggle-line ${isOpen ? "translate-y-0 rotate-45" : "-translate-y-[6px]"}`}
            />
            <span
              className={`ases-navbar-toggle-line ${isOpen ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`ases-navbar-toggle-line ${isOpen ? "translate-y-0 -rotate-45" : "translate-y-[6px]"}`}
            />
          </button>
        </div>

        {isOpen ? (
          <nav
            aria-label="Mobile primary"
            className="ases-mobile-nav"
            id="mobile-navigation"
          >
            <div className="ases-mobile-nav-panel">
              {primaryLinks.map((link) => (
                <Link
                  className="ases-mobile-nav-link"
                  href={link.href}
                  key={link.label}
                  onClick={closeMenu}
                >
                  <span>{link.label}</span>
                </Link>
              ))}

              <Link
                className="ases-mobile-nav-link ases-mobile-nav-link-cta"
                href="#become-an-ace"
                onClick={closeMenu}
              >
                <span>Become an ACE</span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-[10.72px] w-[10px] shrink-0"
                  src="/assets/icons/arrow-up-right.svg"
                />
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
