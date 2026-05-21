"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SKILL_CATEGORIES } from "@/lib/data";
import {
  Brain,
  MessageSquare,
  Sparkles,
  Eye,
  Cloud,
  Code,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Brain,
  MessageSquare,
  Sparkles,
  Eye,
  Cloud,
  Code,
};

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading
      gsap.fromTo(
        ".skills-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".skills-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Category tabs
      gsap.fromTo(
        ".skill-tab",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: ".skills-tabs",
            start: "top 85%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Animate skill tags when category changes
    const tags = document.querySelectorAll(".skill-tag");
    if (tags.length > 0) {
      gsap.fromTo(
        tags,
        { y: 15, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.03,
        }
      );
    }
  }, [activeCategory]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="skills-heading mb-12">
          <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-2">
            Skills
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Tech Stack
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="skills-tabs flex flex-wrap gap-2 mb-8">
          {SKILL_CATEGORIES.map((cat, index) => {
            const Icon = iconMap[cat.icon] || Code;
            return (
              <button
                key={cat.name}
                className={`skill-tab inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
                  activeCategory === index
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
                }`}
                onClick={() => setActiveCategory(index)}
              >
                <Icon size={14} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Skills Grid */}
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl min-h-[160px]">
          <div className="flex flex-wrap gap-2">
            {SKILL_CATEGORIES[activeCategory].skills.map((skill) => (
              <span
                key={skill}
                className="skill-tag px-3 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* All skills compact view for mobile */}
        <div className="mt-6 md:hidden">
          <p className="text-xs text-slate-600 mb-3">All skills at a glance:</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_CATEGORIES.flatMap((cat) => cat.skills).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs bg-white/[0.03] border border-white/[0.05] rounded text-slate-500"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
