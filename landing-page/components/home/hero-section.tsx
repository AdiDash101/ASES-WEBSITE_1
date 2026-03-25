const heroEmphasisWords = [
  {
    label: "build,",
    className: "ases-hero-sticker-frame-build"
  },
  {
    label: "design",
    className: "ases-hero-sticker-frame-design"
  },
  {
    label: "scale",
    className: "ases-hero-sticker-frame-scale"
  }
] as const;

export function HeroSection() {
  return (
    <section className="ases-hero">
      <div className="ases-container">
        <div className="ases-hero-grid">
          <div className="ases-hero-content">
            <div className="ases-hero-intro">
              <div className="ases-hero-copy-block">
                <h1 className="ases-hero-heading-lockup">
                  <span className="ases-hero-heading-word">Anyone can</span>
                  <span className="sr-only">build, design, or scale.</span>
                  <span aria-hidden="true" className="ases-hero-sticker">
                    {heroEmphasisWords.map((word) => (
                      <span
                        className={`ases-hero-sticker-frame ${word.className}`}
                        key={word.label}
                      >
                        {word.label}
                      </span>
                    ))}
                  </span>
                </h1>

                <p className="ases-hero-subcopy">
                  You just need the community to help bring that vision to life.
                </p>
              </div>

              <img
                alt=""
                aria-hidden="true"
                className="ases-hero-mascot-mobile"
                src="/assets/brand/ases/ace-mascot.svg"
              />
            </div>

            <div className="ases-hero-actions">
              <a className="ases-hero-cta" href="#become-an-ace">
                <span>Join as a Member</span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-3.5 w-3.5 brightness-0 invert"
                  src="/assets/icons/arrow-up-right.svg"
                />
              </a>

              <a className="ases-hero-link" href="#socials">
                Learn More
              </a>
            </div>
          </div>

          <div className="ases-hero-visual">
            <img
              alt=""
              aria-hidden="true"
              className="ases-hero-mascot-desktop"
              src="/assets/brand/ases/ace-mascot.svg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
