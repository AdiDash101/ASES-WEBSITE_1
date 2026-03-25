import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

type FooterQuickLink = {
  href: string;
  label: string;
};

type FooterLegalLink = {
  label: string;
};

type FooterSocialLink = {
  icon: "facebook" | "instagram" | "twitter" | "linkedin";
  label: string;
};

const quickLinks: FooterQuickLink[] = [
  {
    label: "About Us",
    href: "#about"
  },
  {
    label: "Events",
    href: "#events"
  }
];

const legalLinks: FooterLegalLink[] = [
  {
    label: "Privacy Policy"
  },
  {
    label: "Terms of Service"
  }
];

const socialLinks: FooterSocialLink[] = [
  {
    label: "Facebook",
    icon: "facebook"
  },
  {
    label: "Instagram",
    icon: "instagram"
  },
  {
    label: "Twitter",
    icon: "twitter"
  },
  {
    label: "LinkedIn",
    icon: "linkedin"
  }
];

function FooterSocialIcon({ icon }: { icon: FooterSocialLink["icon"] }) {
  const className = "ases-footer-social-icon";

  if (icon === "facebook") {
    return <FaFacebookF aria-hidden="true" className={className} />;
  }

  if (icon === "instagram") {
    return <FaInstagram aria-hidden="true" className={className} />;
  }

  if (icon === "linkedin") {
    return <FaLinkedinIn aria-hidden="true" className={className} />;
  }

  return <FaTwitter aria-hidden="true" className={className} />;
}

export function Footer() {
  return (
    <footer className="ases-footer">
      <div className="ases-container">
        <div className="ases-footer-shell">
          <div className="ases-footer-grid">
            <div className="ases-footer-brand">
              <a aria-label="ASES Manila" className="ases-footer-logo-link" href="/">
                <span aria-hidden="true" className="ases-footer-logo-frame">
                  <img
                    alt=""
                    className="ases-footer-logo"
                    src="/assets/brand/ases/logo-lockup.png"
                    style={{
                      height: "343.94%",
                      left: "-6.83%",
                      top: "-121.77%",
                      width: "114.73%"
                    }}
                  />
                </span>
              </a>

              <p className="ases-footer-tagline">
                Empowering dreamers to be builders.
              </p>

              <div aria-label="ASES Manila social links" className="ases-footer-socials">
                {socialLinks.map((link) => (
                  <button
                    aria-label={link.label}
                    className="ases-footer-social-button"
                    key={link.label}
                    type="button"
                  >
                    <FooterSocialIcon icon={link.icon} />
                  </button>
                ))}
              </div>
            </div>

            <nav aria-label="Quick links" className="ases-footer-links">
              <p className="ases-footer-links-heading">Quick Links</p>

              <div className="ases-footer-links-list">
                {quickLinks.map((link) => (
                  <a className="ases-footer-link" href={link.href} key={link.label}>
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>

            <div aria-hidden="true" className="ases-footer-mascot">
              <img
                alt=""
                className="ases-footer-mascot-image"
                src="/assets/brand/ases/ace-mascot.svg"
              />
            </div>
          </div>

          <div aria-label="Legal links" className="ases-footer-legal">
            {legalLinks.map((link) => (
              <button className="ases-footer-legal-link" key={link.label} type="button">
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
