"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PERSONAL } from "@/lib/data";
import { Mail, Phone, Linkedin, Send, Loader2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".contact-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".contact-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".contact-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".contact-cards",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".contact-form",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".contact-form",
            start: "top 85%",
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending — in production, hook to an API
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setFormState({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 4000);
    }, 1500);
  };

  const contactLinks = [
    {
      icon: Mail,
      label: "Email",
      value: PERSONAL.email,
      href: `mailto:${PERSONAL.email}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: PERSONAL.phone,
      href: `tel:${PERSONAL.phone}`,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "Hemanth Kumar Chittiprolu",
      href: PERSONAL.linkedin,
    },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="contact-heading mb-12">
          <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-2">
            Contact
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Let&apos;s Connect
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact info cards */}
          <div className="contact-cards space-y-3">
            {contactLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="contact-card flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-200 group"
                >
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/15 transition-colors">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{link.label}</p>
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {link.value}
                    </p>
                  </div>
                </a>
              );
            })}

            {/* Availability badge */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">
                  Immediately Available
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Looking for AI/ML engineering roles. Open to full-time
                positions.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <form
            onSubmit={handleSubmit}
            className="contact-form p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4"
          >
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs text-slate-500 mb-1.5"
              >
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={formState.name}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Your name"
                required
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs text-slate-500 mb-1.5"
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={formState.email}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="your@email.com"
                required
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs text-slate-500 mb-1.5"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                value={formState.message}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, message: e.target.value }))
                }
                placeholder="Tell me about the opportunity..."
                required
                rows={4}
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-[#0a0f1a] rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                "Message Sent!"
              ) : (
                <>
                  <Send size={14} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
