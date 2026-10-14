import { Check } from "lucide-react";
import type { Metadata } from "next";
import { MarketingCta, MarketingShell } from "../../components/marketing/MarketingShell";
import { MARKETING_FEATURES } from "../../components/marketing/marketingContent";

export const metadata: Metadata = {
  title: "Features | Agency Board",
  description:
    "Kanban tasks, projects with costed resources, subscription tracking, team invites, an activity feed, and file attachments — in one agency workspace.",
};

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mk-hero mk-hero-compact">
        <div className="mk-container">
          <p className="mk-eyebrow">Features</p>
          <h1 className="mk-h1">What&apos;s in Agency Board</h1>
          <p className="mk-lede mk-lede-lg">
            Built for the way agencies work: lots of clients, lots of moving parts, and a stack
            of tools to keep paying for.
          </p>
        </div>
      </section>

      <div className="mk-container mk-feature-list">
        {MARKETING_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <section
              className={`mk-feature-row${index % 2 === 1 ? " mk-feature-row-flip" : ""}`}
              key={feature.id}
              aria-labelledby={`feature-${feature.id}`}
            >
              <div>
                <span className="mk-card-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h2 className="mk-h2" id={`feature-${feature.id}`}>
                  {feature.title}
                </h2>
                <p className="mk-lede">{feature.summary}</p>
              </div>
              <ul className="mk-checklist">
                {feature.points.map((point) => (
                  <li key={point}>
                    <Check size={15} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <MarketingCta
        title="See it with your own work"
        body="Create a workspace and add your first task in a few minutes."
      />
    </MarketingShell>
  );
}
