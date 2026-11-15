import type { ReactNode } from "react";
import "./auth-page-shell.css";

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="auth-stage">
      <div className="auth-card">
        <aside className="auth-brand-panel">
          <span className="auth-eyebrow">Watermelon Market</span>
          <div className="auth-brand-copy">
            <p className="auth-kicker">A better way to buy</p>
            <h2>Good business starts with good ingredients.</h2>
            <p className="auth-brand-description">
              Discover a fresher way to connect with the products and suppliers
              your business needs.
            </p>
          </div>
          <div className="auth-watermelon-art" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="auth-brand-caption">A marketplace that works for you.</p>
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          <div className="auth-form-content">{children}</div>
          <footer className="auth-form-footer">{footer}</footer>
        </div>
      </div>
    </section>
  );
}

export const authInputClassName = "auth-input";
export const authLabelClassName = "auth-label";
