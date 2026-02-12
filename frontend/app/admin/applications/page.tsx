"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decideAdminApplication,
  getAdminApplication,
  getSession,
  listAdminApplications,
  verifyAdminApplicationPayment,
} from "@/lib/api/client";
import type { AdminApplicationDetail, AdminApplicationListItem } from "@/lib/api/types";
import { labelByField } from "@/lib/application/schema";
import styles from "./page.module.css";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:4000";

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTimeFull = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

type StatusKey = AdminApplicationListItem["status"];

const statusConfig: Record<StatusKey, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "statusDraft" },
  PENDING: { label: "Pending", className: "statusPending" },
  REJECTED: { label: "Rejected", className: "statusRejected" },
  ACCEPTED: { label: "Accepted", className: "statusAccepted" },
};

const formatAnswerValue = (value: unknown) => {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const fieldOrder = Object.keys(labelByField);

type FilterStatus = "ALL" | StatusKey;

export default function AdminApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<"admin" | "signed_out" | "forbidden">("signed_out");
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const refreshList = useCallback(async () => {
    const response = await listAdminApplications();
    setItems(response.data);
    return response.data;
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const response = await getAdminApplication(id);
    setSelectedId(id);
    setDetail(response.data);
    setDecisionNote(response.data.decisionNote ?? "");
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const session = await getSession();
      if (!session.user) { setAuthState("signed_out"); return; }
      if (session.user.role !== "ADMIN") { setAuthState("forbidden"); return; }
      setAuthState("admin");
      const applications = await refreshList();
      if (applications.length === 0) { setSelectedId(null); setDetail(null); return; }
      const targetId = selectedId && applications.some((item) => item.id === selectedId)
        ? selectedId
        : applications[0]?.id;
      if (targetId) await loadDetail(targetId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load admin dashboard.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [loadDetail, refreshList, selectedId]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  /* ── Stats ─────────────────────────────────── */
  const stats = useMemo(() => {
    const counts = { total: items.length, pending: 0, accepted: 0, rejected: 0, unverified: 0 };
    for (const item of items) {
      if (item.status === "PENDING") counts.pending++;
      if (item.status === "ACCEPTED") counts.accepted++;
      if (item.status === "REJECTED") counts.rejected++;
      if (!item.paymentVerifiedAt) counts.unverified++;
    }
    return counts;
  }, [items]);

  /* ── Filtered list ─────────────────────────── */
  const filteredItems = useMemo(() => {
    if (filterStatus === "ALL") return items;
    return items.filter((item) => item.status === filterStatus);
  }, [items, filterStatus]);

  const selectableAnswers = useMemo(() => {
    if (!detail) return [] as Array<{ key: string; label: string; value: unknown }>;
    const answers = detail.answers ?? detail.answersJson ?? {};
    const known = fieldOrder
      .filter((key) => key in answers)
      .map((key) => ({ key, label: labelByField[key as keyof typeof labelByField] ?? key, value: answers[key] }));
    const knownSet = new Set(known.map((item) => item.key));
    const unknown = Object.entries(answers)
      .filter(([key]) => !knownSet.has(key))
      .map(([key, value]) => ({ key, label: key, value }));
    return [...known, ...unknown];
  }, [detail]);

  const verifyPayment = async () => {
    if (!detail) return;
    setIsBusy(true); setErrorMessage(null); setSuccessMessage(null);
    try {
      await verifyAdminApplicationPayment(detail.id);
      await refreshList();
      await loadDetail(detail.id);
      setSuccessMessage("Payment verified.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment verification failed.");
    } finally { setIsBusy(false); }
  };

  const submitDecision = async (status: "ACCEPTED" | "REJECTED") => {
    if (!detail) return;
    setIsBusy(true); setErrorMessage(null); setSuccessMessage(null);
    try {
      await decideAdminApplication(detail.id, status, decisionNote);
      await refreshList();
      await loadDetail(detail.id);
      setSuccessMessage(status === "ACCEPTED" ? "Application accepted." : "Application rejected.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to set application decision.");
    } finally { setIsBusy(false); }
  };

  /* ── Loading state ─────────────────────────── */
  if (loading) {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Loading dashboard...</h1>
          <div className={styles.loadingBar}><div className={styles.loadingBarFill} /></div>
        </header>
      </main>
    );
  }

  /* ── Not signed in ─────────────────────────── */
  if (authState === "signed_out") {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Admin Dashboard</h1>
          <p className={styles.heroSubtitle}>Sign in with your admin account to continue.</p>
        </header>
        <section className={styles.centerCard}>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href={`${API_ORIGIN}/auth/google`}>
            Sign in with Google
          </a>
        </section>
      </main>
    );
  }

  /* ── Forbidden ─────────────────────────────── */
  if (authState === "forbidden") {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Access denied</h1>
          <p className={styles.heroSubtitle}>Your account does not have admin permissions.</p>
        </header>
      </main>
    );
  }

  /* ── Main dashboard ────────────────────────── */
  const detailStatus = detail ? statusConfig[detail.status] : null;

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Application Review</h1>
      </header>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={`${styles.statItem} ${styles.statPending}`}>
          <span className={styles.statNumber}>{stats.pending}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={`${styles.statItem} ${styles.statAccepted}`}>
          <span className={styles.statNumber}>{stats.accepted}</span>
          <span className={styles.statLabel}>Accepted</span>
        </div>
        <div className={`${styles.statItem} ${styles.statRejected}`}>
          <span className={styles.statNumber}>{stats.rejected}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.unverified}</span>
          <span className={styles.statLabel}>Unpaid</span>
        </div>
      </div>

      {/* Toast messages */}
      {errorMessage ? (
        <div className={`${styles.toast} ${styles.toastError}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className={`${styles.toast} ${styles.toastSuccess}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {successMessage}
        </div>
      ) : null}

      {/* Main layout */}
      <div className={styles.layout}>
        {/* Left sidebar: filters + list */}
        <section className={`${styles.panel} ${styles.panelSticky}`}>
          <div className={styles.sidebarHead}>
            <h2 className={styles.sidebarTitle}>Applications</h2>
            <span className={styles.sidebarCount}>{filteredItems.length}</span>
          </div>

          {/* Status filter tabs */}
          <div className={styles.filterTabs}>
            {(["ALL", "PENDING", "ACCEPTED", "REJECTED", "DRAFT"] as FilterStatus[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.filterTab} ${filterStatus === key ? styles.filterTabActive : ""}`}
                onClick={() => setFilterStatus(key)}
              >
                {key === "ALL" ? "All" : statusConfig[key as StatusKey].label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className={styles.list}>
            {filteredItems.length === 0 ? (
              <p className={styles.emptyList}>No applications found.</p>
            ) : null}
            {filteredItems.map((item) => {
              const sc = statusConfig[item.status];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.listItem} ${selectedId === item.id ? styles.listItemSelected : ""}`}
                  onClick={() => { void loadDetail(item.id); }}
                >
                  <div className={styles.listItemTop}>
                    <span className={`${styles.statusPill} ${styles[sc.className]}`}>{sc.label}</span>
                    {!item.paymentVerifiedAt && (
                      <span className={styles.unpaidDot} title="Payment unverified" />
                    )}
                  </div>
                  <strong className={styles.listItemName}>{item.user.name || "Unnamed"}</strong>
                  <span className={styles.listItemEmail}>{item.user.email}</span>
                  <span className={styles.listItemDate}>{formatDateTime(item.submittedAt)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: detail view */}
        <section className={styles.detailPane}>
          {!detail ? (
            <div className={styles.detailEmpty}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={styles.detailEmptyIcon}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>Select an application to review</p>
            </div>
          ) : (
            <>
              {/* Applicant header card */}
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>
                  {(detail.user.name || "?")[0].toUpperCase()}
                </div>
                <div className={styles.detailHeaderInfo}>
                  <h2 className={styles.detailName}>{detail.user.name}</h2>
                  <p className={styles.detailEmail}>{detail.user.email}</p>
                </div>
                {detailStatus && (
                  <span className={`${styles.statusPill} ${styles[detailStatus.className]}`}>
                    {detailStatus.label}
                  </span>
                )}
              </div>

              {/* Meta grid */}
              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Submitted</span>
                  <span className={styles.metaValue}>{formatDateTimeFull(detail.submittedAt)}</span>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Payment uploaded</span>
                  <span className={styles.metaValue}>{formatDateTimeFull(detail.paymentProofUploadedAt)}</span>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Payment verified</span>
                  <span className={`${styles.metaValue} ${detail.paymentVerifiedAt ? styles.metaOk : styles.metaWarn}`}>
                    {detail.paymentVerifiedAt ? formatDateTimeFull(detail.paymentVerifiedAt) : "Not yet"}
                  </span>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Reviewed</span>
                  <span className={styles.metaValue}>{formatDateTimeFull(detail.reviewedAt)}</span>
                </div>
              </div>

              {/* Payment proof */}
              {detail.paymentProofViewUrl ? (
                <div className={styles.proofSection}>
                  <a
                    href={detail.paymentProofViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${styles.btn} ${styles.btnGhost}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    View payment proof
                  </a>
                </div>
              ) : null}

              {/* Decision tools */}
              <div className={styles.decisionSection}>
                <h3 className={styles.sectionTitle}>Decision</h3>
                <textarea
                  className={styles.textarea}
                  placeholder="Add a note (optional)..."
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  disabled={isBusy}
                  rows={3}
                />
                <div className={styles.decisionActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    disabled={isBusy || Boolean(detail.paymentVerifiedAt)}
                    onClick={verifyPayment}
                  >
                    {detail.paymentVerifiedAt ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified
                      </>
                    ) : (
                      "Verify payment"
                    )}
                  </button>
                  <div className={styles.decisionBtns}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnAccept}`}
                      disabled={isBusy || !detail.paymentVerifiedAt}
                      onClick={() => { void submitDecision("ACCEPTED"); }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnReject}`}
                      disabled={isBusy}
                      onClick={() => { void submitDecision("REJECTED"); }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className={styles.answersSection}>
                <h3 className={styles.sectionTitle}>Application Answers</h3>
                {selectableAnswers.length === 0 ? (
                  <p className={styles.emptyList}>No answers were saved.</p>
                ) : (
                  <div className={styles.answersList}>
                    {selectableAnswers.map((entry) => (
                      <div key={entry.key} className={styles.answerCard}>
                        <span className={styles.answerLabel}>{entry.label}</span>
                        <p className={styles.answerValue}>{formatAnswerValue(entry.value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
