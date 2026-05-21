"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { PERSONAL, STATS } from "@/lib/data";
import { ChevronDown, Download, Mail } from "lucide-react";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 2.5 });

    // Name reveal — split by line
    if (titleRef.current) {
      const lines = titleRef.current.querySelectorAll(".hero-line");
      tl.fromTo(
        lines,
        { y: 80, opacity: 0, rotateX: -30 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
        },
        0
      );
    }

    // Subtitle
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        0.6
      );
    }

    // CTA buttons
    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current.children,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
        },
        0.9
      );
    }

    // Stats
    if (statsRef.current) {
      tl.fromTo(
        statsRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
        },
        1.1
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Greeting */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Available for hire
        </div>

        {/* Name */}
        <h1
          ref={titleRef}
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
          style={{ perspective: "600px" }}
        >
          <span className="hero-line block">Hi, I&apos;m</span>
          <span className="hero-line block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            {PERSONAL.name}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {PERSONAL.tagline}{" "}
          <span className="text-slate-300">
            AI/ML Engineer specializing in production systems, LLMs, and
            end-to-end machine learning pipelines.
          </span>
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <a
            href="#ai-chat"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-[#0a0f1a] rounded-full hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Mail size={16} />
            Talk to My AI
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300"
          >
            Get in Touch
          </a>
          <a
            href="/Hemanth_Resume.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-400 hover:text-white transition-all duration-300"
          >
            <Download size={16} />
            Resume
          </a>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {stat.value}
                <span className="text-emerald-400">{stat.suffix}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() =>
          document
            .getElementById("about")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 hover:text-emerald-400 transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  );
}
