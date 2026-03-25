"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api/client";
import styles from "./page.module.css";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getSession()
      .then((res) => setIsAdmin(res.user?.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Applications Portal</h1>
        <p className={styles.subtitle}>
          Apply to join ASES Manila, track your progress, and manage the review pipeline.
        </p>
      </header>

      <section className={styles.grid}>
        <Link href="/application" className={styles.card}>
          <div className={styles.cardIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Applicant Portal</h2>
            <p className={styles.cardDesc}>
              Fill out your application with autosave, upload payment proof, and track your status.
            </p>
          </div>
          <span className={styles.cardArrow}>&rarr;</span>
        </Link>

        {isAdmin && (
          <Link href="/admin/applications" className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Admin Dashboard</h2>
              <p className={styles.cardDesc}>
                Review applications, verify payment receipts, and accept or reject applicants.
              </p>
            </div>
            <span className={styles.cardArrow}>&rarr;</span>
          </Link>
        )}
      </section>
    </main>
  );
}
