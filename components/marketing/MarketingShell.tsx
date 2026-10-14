import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="mk-shell">
      <header className="mk-nav">
        <div className="mk-container mk-nav-inner">
          <Link href="/" className="mk-brand" aria-label="Agency Board home">
            <span className="brand-mark" aria-hidden="true">
              <LayoutGrid size={16} strokeWidth={2.4} />
            </span>
            <span className="brand-name">Agency Board</span>
          </Link>

          <nav className="mk-nav-links" aria-label="Primary">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>

          <div className="mk-nav-actions">
            <Link href="/login" className="mk-link-quiet">
              Log in
            </Link>
            <Link href="/signup" className="mk-btn mk-btn-primary mk-btn-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mk-main">{children}</main>

      <footer className="mk-footer">
        <div className="mk-container mk-footer-inner">
          <div className="mk-footer-brand">
            <span className="brand-name">Agency Board</span>
            <p>Tasks, projects, and tool spend for agency teams.</p>
          </div>
          <nav className="mk-footer-links" aria-label="Footer">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function MarketingCta({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="mk-cta">
      <div className="mk-container mk-cta-inner">
        <h2 className="mk-h2">{title}</h2>
        <p className="mk-lede">{body}</p>
        <div className="mk-actions">
          <Link href="/signup" className="mk-btn mk-btn-primary">
            Create your workspace
          </Link>
          <Link href="/login" className="mk-btn mk-btn-ghost">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
