"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, logout as apiLogout } from "@/lib/api/client";
import type { PublicUser } from "@/lib/api/types";
import styles from "./Navbar.module.css";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:3001";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSession()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/application", label: "Application" },
    ...(isAdmin ? [{ href: "/admin/applications", label: "Admin" }] : []),
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          ASES
        </Link>

        <div className={styles.links}>
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.right}>
          {loaded && !user && (
            <a className={styles.signIn} href={`${API_ORIGIN}/auth/google`}>
              Sign in
            </a>
          )}

          {user && (
            <div className={styles.userWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.userBtn}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
              >
                <span className={styles.userName}>{user.name.split(" ")[0]}</span>
                <span className={styles.avatar}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={styles.avatarImg}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    user.name[0]?.toUpperCase() ?? "?"
                  )}
                </span>
              </button>

              {menuOpen && (
                <div className={styles.menu}>
                  <div className={styles.menuHeader}>
                    <span className={styles.menuName}>{user.name}</span>
                    <span className={styles.menuEmail}>{user.email}</span>
                  </div>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
