import type { ReactNode } from "react";

type AboutMetric = {
  accentClassName: string;
  label: string;
  value: string;
};

type AboutNarrative = {
  body: ReactNode;
  title: string;
};

const metrics: AboutMetric[] = [
  {
    value: "40",
    label: "Events Hosted",
    accentClassName: "text-brand-iris-deep"
  },
  {
    value: "200+",
    label: "Active Members",
    accentClassName: "text-brand-iris"
  },
  {
    value: "150+",
    label: "Connections formed",
    accentClassName: "text-brand-iris"
  },
  {
    value: "20",
    label: "Startups Incubated",
    accentClassName: "text-brand-iris-deep"
  }
];

const narratives: AboutNarrative[] = [
  {
    title: "VISION",
    body: (
      <>
        We cultivate a generation of Filipino builders that turn{" "}
        <strong>ambition</strong> into <strong>action</strong>, creating
        scalable ventures that solve real problems.
      </>
    )
  },
  {
    title: "MISSION",
    body: (
      <>
        We turn dreamers into builders by providing the{" "}
        <strong>community</strong>, <strong>credibility</strong>, and{" "}
        <strong>courage</strong> to start building, and to build right.
      </>
    )
  }
];

export function AboutSection() {
  return (
    <section
      aria-labelledby="about-heading"
      className="ases-about-section"
      id="about"
    >
      <div className="ases-container">
        <div className="ases-about-shell">
          <header className="ases-about-header">
            <h2 className="sr-only" id="about-heading">
              About ASES Manila
            </h2>

            <div aria-hidden="true" className="ases-about-logo-frame">
              <img
                alt=""
                className="ases-about-logo-image"
                src="/assets/brand/ases/logo-full.png"
              />
            </div>

            <p className="ases-about-description">
              also known as the Affiliated Stanford Entrepreneurial Society -
              Manila Chapter, is a student entrepreneurship community under
              Stanford University composed of college students passionate about
              technology, design thinking, and entrepreneurship.
            </p>
          </header>

          <div className="ases-about-metrics">
            {metrics.map((metric) => (
              <article className="ases-about-stat" key={metric.label}>
                <p className={`ases-about-stat-value ${metric.accentClassName}`}>
                  {metric.value}
                </p>
                <p className="ases-about-stat-label">{metric.label}</p>
              </article>
            ))}
          </div>

          <div className="ases-about-story">
            <div aria-hidden="true" className="ases-about-story-lockup">
              <p className="ases-about-story-line">Regardless of</p>
              <div className="ases-about-story-sticker">
                <span>Who You Are,</span>
              </div>
            </div>

            <div className="ases-about-copy-grid">
              {narratives.map((narrative) => (
                <article className="ases-about-copy-group" key={narrative.title}>
                  <h3 className="ases-about-copy-heading">{narrative.title}</h3>
                  <p className="ases-about-copy-body">{narrative.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
