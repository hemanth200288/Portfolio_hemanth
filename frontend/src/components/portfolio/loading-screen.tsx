"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out the entire loader
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    // Animate the progress bar
    const progressObj = { val: 0 };
    tl.to(progressObj, {
      val: 100,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(progressObj.val);
        setProgress(v);
        if (percentRef.current) {
          percentRef.current.textContent = `${v}%`;
        }
        if (progressRef.current) {
          progressRef.current.style.width = `${v}%`;
        }
      },
    });

    // Text typing effect
    if (textRef.current) {
      const words = [
        "Initializing Hemanth's portfolio...",
        "Loading AI systems...",
        "Calibrating neural networks...",
        "Almost ready...",
      ];
      let wordIndex = 0;
      const interval = setInterval(() => {
        wordIndex = (wordIndex + 1) % words.length;
        if (textRef.current) {
          gsap.to(textRef.current, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            onComplete: () => {
              if (textRef.current) {
                textRef.current.textContent = words[wordIndex];
                gsap.to(textRef.current, {
                  opacity: 1,
                  y: 0,
                  duration: 0.3,
                });
              }
            },
          });
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0f1a]"
    >
      {/* Animated dots background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-500/10"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Logo / Name */}
      <div className="relative mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          <span className="text-emerald-400">{"<"}</span>
          Hemanth
          <span className="text-emerald-400">{" />"}</span>
        </h1>
      </div>

      {/* Status text */}
      <div
        ref={textRef}
        className="text-sm text-slate-400 mb-6 h-5"
      >
        Initializing Hemanth&apos;s portfolio...
      </div>

      {/* Progress bar */}
      <div className="w-48 md:w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          style={{ width: "0%" }}
        />
      </div>

      {/* Percentage */}
      <span
        ref={percentRef}
        className="text-xs text-slate-500 mt-2 font-mono"
      >
        0%
      </span>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
