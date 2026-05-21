"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook: useGSAPScrollTrigger
 * Creates a ScrollTrigger that calls an animation setup function
 * when the element enters the viewport. Auto-cleans up on unmount.
 */
export function useGSAPScrollTrigger(
  callback: (el: HTMLElement, trigger: ScrollTrigger) => void,
  options?: ScrollTrigger.Vars
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      ...options,
      onEnter: () => callback(el, trigger),
    });

    return () => {
      trigger.kill();
    };
  }, [callback, options]);

  return ref;
}

/**
 * Hook: useGSAPContext
 * Provides a GSAP context for animation cleanup.
 * Use this for complex animations that need proper cleanup.
 */
export function useGSAPContext() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const createAnimation = useCallback(
    (fn: (ctx: gsap.Context) => void) => {
      if (!containerRef.current) return;
      ctxRef.current = gsap.context(fn, containerRef.current);
    },
    []
  );

  useEffect(() => {
    return () => {
      ctxRef.current?.revert();
    };
  }, []);

  return { containerRef, createAnimation };
}

/**
 * Fade-up animation preset
 */
export function fadeInUp(
  targets: gsap.TweenTarget,
  vars?: gsap.TweenVars
) {
  return gsap.fromTo(
    targets,
    { y: 60, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.1,
      ...vars,
    }
  );
}

/**
 * Stagger reveal animation preset
 */
export function staggerReveal(
  targets: gsap.TweenTarget,
  vars?: gsap.TweenVars
) {
  return gsap.fromTo(
    targets,
    { y: 40, opacity: 0, scale: 0.95 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.08,
      ...vars,
    }
  );
}

/**
 * Text split animation — characters reveal one by one
 */
export function splitTextReveal(
  element: HTMLElement,
  vars?: gsap.TweenVars
) {
  const text = element.textContent || "";
  element.textContent = "";

  const chars = text.split("").map((char) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.display = "inline-block";
    span.style.opacity = "0";
    span.style.transform = "translateY(20px)";
    element.appendChild(span);
    return span;
  });

  return gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: "power2.out",
    stagger: 0.02,
    ...vars,
  });
}

export { gsap, ScrollTrigger };
