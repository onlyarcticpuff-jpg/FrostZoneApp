type Props = {
  title: string;
  children: React.ReactNode;
  /** Optional accent colour — matches the nav tab accents */
  accent?: string;
  /** Compact mode: less padding, smaller title */
  compact?: boolean;
};

export default function FrostCard({
  title,
  children,
  accent = "rgba(255,255,255,0.55)",
  compact = false,
}: Props) {
  return (
    <>
      <style>{`
        /* ── Base card ── */
        .frost-card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;

          /* Apple-glass fill */
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(40px) saturate(200%) brightness(1.08);
          -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.08);

          /* Layered borders for the "lens edge" look */
          border: 1px solid rgba(255, 255, 255, 0.13);

          /* Shadow stack: ambient + close */
          box-shadow:
            0 2px 0 rgba(255, 255, 255, 0.09) inset,   /* top highlight */
            0 -1px 0 rgba(0, 0, 0, 0.18) inset,        /* bottom shadow */
            0 8px 32px rgba(0, 0, 0, 0.38),
            0 2px 8px  rgba(0, 0, 0, 0.22);

          padding: ${compact ? "16px 18px" : "22px 22px"};
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.18s ease;
        }

        /* Subtle press */
        .frost-card:active {
          transform: scale(0.985);
        }

        /* ── Top-edge specular line ── */
        .frost-card::before {
          content: "";
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.28) 40%,
            rgba(255, 255, 255, 0.28) 60%,
            transparent
          );
          border-radius: 0 0 100% 100%;
          pointer-events: none;
        }

        /* ── Accent glow blob (top-left corner) ── */
        .frost-card::after {
          content: "";
          position: absolute;
          top: -30px; left: -20px;
          width: 120px; height: 80px;
          background: var(--card-accent, rgba(255,255,255,0.55));
          border-radius: 50%;
          filter: blur(36px);
          opacity: 0.12;
          pointer-events: none;
        }

        /* ── Title ── */
        .frost-card__title {
          position: relative;
          z-index: 1;
          margin: 0 0 ${compact ? "10px" : "14px"} 0;
          font-size: ${compact ? "13px" : "15px"};
          font-weight: 700;
          letter-spacing: 0.1px;
          font-family: -apple-system, "SF Pro Rounded", "SF Pro Text", system-ui, sans-serif;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.2;

          /* Crisp text glow matching the accent */
          text-shadow: 0 0 20px var(--card-accent, rgba(255,255,255,0.3));
        }

        /* ── Content ── */
        .frost-card__body {
          position: relative;
          z-index: 1;
          color: rgba(255, 255, 255, 0.62);
          font-family: -apple-system, "SF Pro Text", system-ui, sans-serif;
          font-size: ${compact ? "13px" : "14px"};
          line-height: 1.5;
        }
      `}</style>

      <section
        className="frost-card"
        style={{ "--card-accent": accent } as React.CSSProperties}
      >
        <h2 className="frost-card__title">{title}</h2>
        <div className="frost-card__body">{children}</div>
      </section>
    </>
  );
}
