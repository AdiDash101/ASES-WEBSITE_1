import Image from "next/image";
import type { CSSProperties } from "react";

type ProjectCard = {
  category: string;
  categoryBg: string;
  categoryText: string;
  description: string;
  founder: string;
  id: string;
  imageAlt: string;
  imagePosition?: string;
  imageScale?: number;
  imageSrc: string;
  impact: string;
  impactColor: string;
  title: string;
};

const projectCards: ProjectCard[] = [
  {
    id: "educonnect",
    title: "EduConnect",
    category: "EdTech",
    categoryBg: "#64B4FF",
    categoryText: "#0A2A38",
    description:
      "AI-powered learning platform connecting students with personalized tutors",
    founder: "Maria Santos",
    impact: "10K+ Users",
    impactColor: "#64B4FF",
    imageSrc: "/assets/home/projects/educonnect.jpg",
    imageAlt: "A phone displaying an education app in front of a laptop screen.",
    imagePosition: "center 56%",
    imageScale: 1.12
  },
  {
    id: "localbazaar",
    title: "LocalBazaar",
    category: "E-Commerce",
    categoryBg: "#40D2C8",
    categoryText: "#0A2A38",
    description:
      "E-commerce platform empowering local Filipino artisans and small businesses",
    founder: "Juan dela Cruz",
    impact: "500+ Merchants",
    impactColor: "#40D2C8",
    imageSrc: "/assets/home/projects/localbazaar.jpg",
    imageAlt: "A laptop displaying an e-commerce storefront.",
    imagePosition: "center 44%",
    imageScale: 1.08
  },
  {
    id: "healthhub",
    title: "HealthHub PH",
    category: "HealthTech",
    categoryBg: "#64DCA0",
    categoryText: "#0A2A38",
    description:
      "Telemedicine app making healthcare accessible to remote communities",
    founder: "Dr. Angela Reyes",
    impact: "50K+ Consultations",
    impactColor: "#64DCA0",
    imageSrc: "/assets/home/projects/healthhub.jpg",
    imageAlt: "A roadside electronic sign with a healthcare symbol.",
    imagePosition: "center 52%",
    imageScale: 1.06
  },
  {
    id: "greenroute",
    title: "GreenRoute",
    category: "LogisticsTech",
    categoryBg: "#FF2C07",
    categoryText: "#FFFFFF",
    description:
      "Smart logistics platform optimizing delivery routes to reduce carbon emissions",
    founder: "Carlos Mendoza",
    impact: "30% CO2 Reduction",
    impactColor: "#FF2C07",
    imageSrc: "/assets/home/projects/greenroute.jpg",
    imageAlt: "A dark code editor interface.",
    imagePosition: "center 35%",
    imageScale: 1.08
  },
  {
    id: "skillswap",
    title: "SkillSwap",
    category: "Social Learning",
    categoryBg: "#97B6F8",
    categoryText: "#FFFFFF",
    description:
      "Peer-to-peer platform for students to exchange skills and knowledge",
    founder: "Sofia Lim",
    impact: "25K+ Exchanges",
    impactColor: "#3F439C",
    imageSrc: "/assets/home/projects/skillswap.jpg",
    imageAlt: "People collaborating around a set of desks.",
    imagePosition: "center 48%",
    imageScale: 1.06
  },
  {
    id: "farmlink",
    title: "FarmLink",
    category: "AgriTech",
    categoryBg: "#251E73",
    categoryText: "#FFFFFF",
    description:
      "Direct farm-to-consumer app connecting local farmers with urban buyers",
    founder: "Ricardo Tan",
    impact: "200+ Farmers",
    impactColor: "#251E73",
    imageSrc: "/assets/home/projects/farmlink.jpg",
    imageAlt: "Two people welding in a workshop.",
    imagePosition: "center 44%",
    imageScale: 1.05
  }
];

const projectActions = [
  {
    iconSrc: "/assets/icons/projects/visit.svg",
    label: "Visit"
  },
  {
    iconSrc: "/assets/icons/projects/code.svg",
    label: "Code"
  },
  {
    iconSrc: "/assets/icons/projects/learn-more.svg",
    label: "Learn More"
  }
] as const;

export function BuiltByAcesSection() {
  return (
    <section
      aria-labelledby="built-by-aces-heading"
      className="ases-projects-section"
      id="projects"
    >
      <div className="ases-container">
        <div className="ases-projects-shell">
          <header className="ases-projects-header">
            <h2 className="ases-projects-title" id="built-by-aces-heading">
              Built by ACEs
            </h2>
            <p className="ases-projects-subtitle">
              Real ventures solving real problems
            </p>
          </header>

          <div className="ases-projects-grid">
            {projectCards.map((project) => (
              <article
                className="ases-project-card"
                key={project.id}
                style={
                  {
                    "--project-chip-bg": project.categoryBg,
                    "--project-chip-text": project.categoryText,
                    "--project-impact": project.impactColor
                  } as CSSProperties
                }
              >
                <div className="ases-project-card-media">
                  <Image
                    alt={project.imageAlt}
                    className="ases-project-card-image"
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                    src={project.imageSrc}
                    style={
                      {
                        objectPosition: project.imagePosition,
                        transform: `scale(${project.imageScale ?? 1})`
                      } as CSSProperties
                    }
                  />
                  <div aria-hidden="true" className="ases-project-card-overlay" />
                  <span className="ases-project-chip">{project.category}</span>
                  <h3 className="ases-project-card-title">{project.title}</h3>
                </div>

                <div className="ases-project-card-body">
                  <p className="ases-project-card-copy">{project.description}</p>

                  <div className="ases-project-meta">
                    <div className="ases-project-meta-block">
                      <span className="ases-project-meta-label">Founder</span>
                      <span className="ases-project-meta-value">
                        {project.founder}
                      </span>
                    </div>

                    <div className="ases-project-meta-block ases-project-meta-block-impact">
                      <span className="ases-project-meta-label">Impact</span>
                      <span className="ases-project-meta-impact">
                        {project.impact}
                      </span>
                    </div>
                  </div>

                  <div className="ases-project-actions" role="group">
                    {projectActions.map((action) => (
                      <button
                        aria-label={`${action.label} ${project.title}`}
                        className="ases-project-action"
                        key={action.label}
                        type="button"
                      >
                        <img
                          alt=""
                          aria-hidden="true"
                          className="ases-project-action-icon"
                          src={action.iconSrc}
                        />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button className="ases-projects-cta" type="button">
            <span>See All Projects</span>
            <img
              alt=""
              aria-hidden="true"
              className="h-[18px] w-[17px] shrink-0 brightness-0 invert"
              src="/assets/icons/arrow-up-right.svg"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
