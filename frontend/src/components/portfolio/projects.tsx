"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "@/lib/data";
import { ExternalLink } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading
      gsap.fromTo(
        ".projects-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".projects-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Project cards — staggered
      gsap.fromTo(
        ".project-card",
        { y: 50, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".projects-grid",
            start: "top 85%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="projects-heading mb-12">
          <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-2">
            Projects
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            What I&apos;ve Built
          </h2>
        </div>

        {/* Projects Grid */}
        <div className="projects-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECTS.map((project) => (
            <div
              key={project.title}
              className="project-card group p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Category badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {project.category}
                </span>
                <ExternalLink
                  size={14}
                  className="text-slate-600 group-hover:text-emerald-400 transition-colors"
                />
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                {project.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                {project.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-white/[0.04] border border-white/[0.06] rounded text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
