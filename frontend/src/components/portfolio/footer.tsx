"use client";

export function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <span className="text-emerald-400">{"<"}</span>
          Hemanth
          <span className="text-emerald-400">{" />"}</span>{" "}
          <span className="text-slate-700">
            &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-700">
          <a
            href="mailto:hemanth200288@gmail.com"
            className="hover:text-emerald-400 transition-colors"
          >
            Email
          </a>
          <a
            href="https://linkedin.com/in/hemanth-kumar-chittiprolu-52a762210"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            LinkedIn
          </a>
          <span>Built with Next.js + GSAP</span>
        </div>
      </div>
    </footer>
  );
}
