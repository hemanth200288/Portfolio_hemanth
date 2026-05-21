"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PERSONAL, EXPERIENCE, EDUCATION, ACHIEVEMENTS } from "@/lib/data";
import { MapPin, Briefcase, GraduationCap, Trophy, Globe, Award, Star } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Trophy,
  Globe,
  Award,
  Star,
};

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Section heading
      gsap.fromTo(
        ".about-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Bio text
      gsap.fromTo(
        ".about-bio",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-bio",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Experience card
      gsap.fromTo(
        ".about-experience",
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-experience",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Education card
      gsap.fromTo(
        ".about-education",
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-education",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Achievement items
      gsap.fromTo(
        ".about-achievement",
        { y: 20, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".achievements-grid",
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
      id="about"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="about-heading mb-12">
          <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-2">
            About Me
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Who I Am
          </h2>
        </div>

        {/* Bio */}
        <div className="about-bio max-w-3xl mb-12">
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            {PERSONAL.bio}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-400" />
              {PERSONAL.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase size={14} className="text-emerald-400" />
              {PERSONAL.availability}
            </span>
          </div>
        </div>

        {/* Experience + Education grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Experience */}
          <div className="about-experience p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Briefcase size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {EXPERIENCE.role}
                </h3>
                <p className="text-sm text-slate-500">
                  {EXPERIENCE.company} &middot; {EXPERIENCE.period}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {EXPERIENCE.highlights.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-400 flex gap-2 before:content-['▸'] before:text-emerald-500 before:mt-0.5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Education */}
          <div className="about-education p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <GraduationCap size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {EDUCATION.degree}
                </h3>
                <p className="text-sm text-slate-500">
                  {EDUCATION.university} &middot; {EDUCATION.period}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Specialized in Artificial Intelligence and Machine Learning with
              hands-on experience in deep learning frameworks, NLP, computer
              vision, and production ML systems.
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements-grid">
          <p className="text-sm text-slate-500 font-medium mb-4">
            Achievements &amp; Awards
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Trophy;
              return (
                <div
                  key={achievement.title}
                  className="about-achievement flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="p-1.5 bg-emerald-500/10 rounded-md shrink-0">
                    <Icon size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300">
                    {achievement.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
