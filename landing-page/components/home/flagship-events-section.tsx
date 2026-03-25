import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

type EventCard = {
  description: string;
  id: string;
  imageAlt: string;
  imagePosition: string;
  imageScale?: number;
  imageSrc: string;
  title: string;
};

const eventCards: EventCard[] = [
  {
    id: "bootcamp",
    title: "O to I Bootcamp",
    description:
      "Go from zero to prototype in three weeks, through roasts and hands-on workshops in product, pitching, and execution.",
    imageSrc: "/assets/home/events/bootcamp.jpg",
    imageAlt: "ASES Manila members speaking during O to I Bootcamp.",
    imagePosition: "center 41%"
  },
  {
    id: "student-venture",
    title: "Student Venture Program",
    description:
      "Turn a bold idea into a venture built to last, grounded in real problems, real context, and real impact.",
    imageSrc: "/assets/home/events/student-venture-alt.jpg",
    imageAlt: "ASES Manila members posing after a Student Venture Program session.",
    imagePosition: "center 40%"
  },
  {
    id: "mentor-mentee",
    title: "Mentor-Mentee Program",
    description:
      "Learn from the Best. year-long mentorship, personalized guidance, and practical skill-building.",
    imageSrc: "/assets/home/events/mentor-mentee.jpg",
    imageAlt: "ASES Manila members gathered for the Mentor-Mentee Program.",
    imagePosition: "center 39%",
    imageScale: 1.03
  },
  {
    id: "summit",
    title: "Stanford ASES Summit",
    description:
      "Go global. Join ASES chapters worldwide at our annual week-long event, honing student entrepreneurship & innovation.",
    imageSrc: "/assets/home/events/summit.jpg",
    imageAlt: "ASES Manila members attending the Stanford ASES Summit.",
    imagePosition: "center 44%",
    imageScale: 1.02
  }
];

export function FlagshipEventsSection() {
  return (
    <section
      aria-labelledby="events-heading"
      className="ases-events-section"
      id="events"
    >
      <div className="ases-container">
        <div className="ases-events-shell">
          <header className="ases-events-header">
            <h2 className="ases-events-title" id="events-heading">
              Flagship Events &amp; Initiatives
            </h2>
            <p className="ases-events-subtitle">
              Building together through immersive experiences
            </p>
          </header>

          <div className="ases-events-grid">
            {eventCards.map((event) => (
              <article className="ases-event-card" key={event.id}>
                <div className="ases-event-card-media">
                  <Image
                    alt={event.imageAlt}
                    className="ases-event-card-image"
                    fill
                    sizes="(min-width: 1280px) 38vw, (min-width: 768px) 44vw, 100vw"
                    src={event.imageSrc}
                    style={
                      {
                        objectPosition: event.imagePosition,
                        transform: `scale(${event.imageScale ?? 1})`
                      } as CSSProperties
                    }
                  />
                  <div aria-hidden="true" className="ases-event-card-overlay" />
                </div>

                <div className="ases-event-card-body">
                  <h3 className="ases-event-card-title">{event.title}</h3>
                  <p className="ases-event-card-copy">{event.description}</p>
                </div>
              </article>
            ))}
          </div>

          <Link className="ases-events-cta" href="#become-an-ace">
            <span>Learn More</span>
            <img
              alt=""
              aria-hidden="true"
              className="h-[18px] w-[17px] shrink-0 brightness-0 invert"
              src="/assets/icons/arrow-up-right.svg"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
