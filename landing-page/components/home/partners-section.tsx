import Image from "next/image";
import type { CSSProperties } from "react";

type PartnerLogo = {
  height: number;
  id: string;
  src: string;
  width: number;
};

const partnerLogos: PartnerLogo[] = [
  {
    id: "partner-01",
    src: "/assets/home/partners/partner-01.png",
    width: 236.776,
    height: 52.165
  },
  {
    id: "partner-02",
    src: "/assets/home/partners/partner-02.png",
    width: 213.731,
    height: 61.044
  },
  {
    id: "partner-03",
    src: "/assets/home/partners/partner-03.png",
    width: 196.336,
    height: 51.768
  },
  {
    id: "partner-04",
    src: "/assets/home/partners/partner-04.png",
    width: 152.573,
    height: 79.846
  },
  {
    id: "partner-05",
    src: "/assets/home/partners/partner-05.png",
    width: 177.849,
    height: 39.919
  },
  {
    id: "partner-06",
    src: "/assets/home/partners/partner-06.png",
    width: 159.602,
    height: 39.92
  },
  {
    id: "partner-07",
    src: "/assets/home/partners/partner-07.png",
    width: 102.832,
    height: 37.896
  },
  {
    id: "partner-08",
    src: "/assets/home/partners/partner-08.png",
    width: 146.255,
    height: 37.897
  },
  {
    id: "partner-09",
    src: "/assets/home/partners/partner-09.png",
    width: 63.235,
    height: 37.892
  }
];

export function PartnersSection() {
  return (
    <section className="ases-partners-section" aria-labelledby="partners-heading">
      <div className="ases-container">
        <div className="ases-partners-inner">
          <p className="ases-partners-label" id="partners-heading">
            Previously Partnered with
          </p>
          <p className="sr-only">
            Previously partnered with Founders Launchpad, Kalibrr, Accenture,
            Kickstart Ventures, Kaya Founders, and other organizations.
          </p>

          <div className="ases-partners-marquee" aria-hidden="true">
            <div className="ases-partners-track">
              {[0, 1].map((groupIndex) => (
                <ul
                  className={
                    groupIndex === 1
                      ? "ases-partners-row ases-partners-row-duplicate"
                      : "ases-partners-row"
                  }
                  key={groupIndex}
                >
                  {partnerLogos.map((logo) => (
                    <li
                      className="ases-partners-logo"
                      key={`${groupIndex}-${logo.id}`}
                      style={
                        {
                          "--partner-height": logo.height,
                          "--partner-width": logo.width
                        } as CSSProperties
                      }
                    >
                      <Image
                        alt=""
                        className="ases-partners-logo-image"
                        height={logo.height}
                        src={logo.src}
                        width={logo.width}
                      />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
