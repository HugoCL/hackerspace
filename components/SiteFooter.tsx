"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const HOME = "hacker";
const WORDS = [
  "builders",
  "dreamers",
  "ai+humans",
  "never settlers",
  "tinkerers",
  "first-timers",
  "night owls",
  "misfits",
  "makers",
  "weekend founders",
  "what-if",
];
const JOIN_EVERY = 3;
const POOL = "abcdefghijklmnopqrstuvwxyz+";

function morphFrame(from: string, to: string, progress: number) {
  const length = Math.round(from.length + (to.length - from.length) * progress);
  const resolved = Math.floor(progress * length);
  let frame = "";
  for (let i = 0; i < length; i++) {
    if (i < resolved) frame += to[i] ?? "";
    else if ((to[i] ?? from[i]) === " ") frame += " ";
    else frame += POOL[Math.floor(Math.random() * POOL.length)];
  }
  return frame;
}

function useMorphingWord(paused: boolean) {
  const [text, setText] = useState(HOME);
  const position = useRef({ index: 0, sinceHome: 0, word: HOME });

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const state = position.current;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let alive = true;

    function next() {
      const from = state.word;
      let to = HOME;
      if (from === HOME || state.sinceHome < JOIN_EVERY) {
        to = WORDS[state.index % WORDS.length];
        state.index++;
        state.sinceHome++;
      } else {
        state.sinceHome = 0;
      }
      state.word = to;
      let start: number | null = null;
      let last = 0;

      function step(now: number) {
        if (!alive) return;
        start ??= now;
        const progress = Math.min(1, (now - start) / 700);
        if (progress === 1) {
          setText(to);
          timer = setTimeout(next, to === HOME ? 4200 : 2400);
          return;
        }
        if (now - last > 45) {
          last = now;
          setText(morphFrame(from, to, progress));
        }
        frame = requestAnimationFrame(step);
      }
      frame = requestAnimationFrame(step);
    }

    timer = setTimeout(next, state.word === HOME ? 3000 : 1200);
    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      setText(state.word);
    };
  }, [paused]);

  return { text, split: position.current.word !== HOME };
}

export default function SiteFooter() {
  const [paused, setPaused] = useState(false);
  const { text, split } = useMorphingWord(paused);

  return (
    <footer className="hs-footer">
      <div className="hs-footer-inner">
        <div className="hs-footer-top">
          <p
            className={
              split ? "hs-footer-mark hs-footer-mark--split" : "hs-footer-mark"
            }
            data-testid="footer-mark"
          >
            <span className="sr-only">Hackerspace</span>
            <span aria-hidden="true">
              <span className="hs-footer-word">{text}</span>
              <span className="hs-footer-gap" />
              space
            </span>
          </p>
          <p className="hs-footer-tagline">
            Un lugar en vivo para descubrir hackathones, formar equipo y mostrar
            lo que construiste.
          </p>
        </div>
        <nav aria-label="Pie de página" className="hs-footer-cols">
          <div className="hs-footer-col">
            <div className="hs-footer-col-title">Explorar</div>
            <ul>
              <li>
                <Link className="hs-footer-link" href="/">
                  Hackathones
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="hs-footer-base">
          <span>© {new Date().getFullYear()} Hackerspace</span>
          <button
            aria-pressed={paused}
            className="hs-footer-pause"
            onClick={() => setPaused((value) => !value)}
            type="button"
          >
            {paused ? "Reanudar animación" : "Pausar animación"}
          </button>
        </div>
      </div>
    </footer>
  );
}
