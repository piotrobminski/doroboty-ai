import type { ReactNode } from "react";
import peopleArt from "../../../docs/design-system/technologia-po-ludzku/assets/human-technology-hero-angular.png";
export function DiscoveryHero({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="discovery-hero">
      <div className="discovery-copy">
        <p className="eyebrow">
          <span className="signal-dot" />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        <div className="discovery-description">{children}</div>
        {actions && <div className="discovery-actions">{actions}</div>}
        <p className="discovery-footnote">
          <span aria-hidden="true">+</span> Technologia. Człowiek. Dobra robota.
        </p>
      </div>
      <div className="discovery-art" aria-hidden="true">
        <img src={peopleArt} alt="" />
        <span className="art-caption">↗ Ludzie w centrum technologii.</span>
      </div>
    </div>
  );
}
