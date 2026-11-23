"use client";

import { Button } from "@ui-sdk/react/button";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

const HOME = "hacker";
const WORDS = [
  "builders",
  "dreamers",
  "ai+humans",
  "never settlers",
  "tinkerers",
  "newcomers",
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

type Morph = { text: string; word: string; phase: "in" | "out" | "decode" };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    update();
    return () => preference.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useMorphingWord(paused: boolean) {
  const [morph, setMorph] = useState<Morph>({
    text: HOME,
    word: HOME,
    phase: "in",
  });
  const position = useRef({ index: 0, sinceHome: 0, word: HOME });

  useEffect(() => {
    if (paused) return;
    const state = position.current;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let alive = true;

    function next() {
      const from = state.word;
      if (from === HOME || state.sinceHome < JOIN_EVERY) {
        const to = WORDS[state.index % WORDS.length];
        setMorph((previous) => ({ ...previous, phase: "out" }));
        timer = setTimeout(() => {
          state.word = to;
          state.index++;
          state.sinceHome++;
          setMorph({ text: to, word: to, phase: "in" });
          timer = setTimeout(next, 3200);
        }, 220);
        return;
      }

      state.word = HOME;
      state.sinceHome = 0;
      let start: number | null = null;
      let last = 0;
      function step(now: number) {
        if (!alive) return;
        start ??= now;
        const progress = Math.min(1, (now - start) / 800);
        if (progress === 1) {
          setMorph({ text: HOME, word: HOME, phase: "in" });
          timer = setTimeout(next, 4200);
          return;
        }
        if (now - last > 45) {
          last = now;
          setMorph({
            text: morphFrame(from, HOME, progress),
            word: HOME,
            phase: "decode",
          });
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
      setMorph({ text: state.word, word: state.word, phase: "in" });
    };
  }, [paused]);

  return morph;
}

// The per-word entrance and its graphics live in design-system/components/bundle.css,
// keyed by data-word. Each letter gets --i (its index) and data-seg (which
// part of a compound word it belongs to).
function MorphLetters({ text }: { text: string }) {
  let segment = 0;
  return text.split("").map((character, index) => {
    const letter = (
      <span
        className="hs-footer-ch"
        data-ch={character === "+" ? "plus" : undefined}
        data-seg={segment}
        // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional and the whole word remounts when it changes
        key={index}
        style={{ "--i": index } as CSSProperties}
      >
        {character}
      </span>
    );
    if (character === "+" || character === " " || character === "-") segment++;
    return letter;
  });
}

export default function SiteFooter({ year }: { year: number }) {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const still = paused || reduced;
  const morph = useMorphingWord(still);
  const { word } = morph;
  const phase = still ? "in" : morph.phase;
  const text = still ? word : morph.text;
  const markClass = [
    "hs-footer-mark",
    word !== HOME && "hs-footer-mark--split",
    phase === "out" && "hs-footer-mark--out",
  ]
    .filter(Boolean)
    .join(" ");
  const wordKey = phase === "decode" ? "decode" : word;

  return (
    <footer className="hs-footer" data-paused={still || undefined}>
      <div className="hs-footer-inner">
        <div className="hs-footer-top">
          <p
            className={markClass}
            data-testid="footer-mark"
            data-word={wordKey.replace(/[^a-z0-9]+/g, "-")}
          >
            <span className="sr-only">Hackerspace</span>
            <span aria-hidden="true">
              <span className="hs-footer-word" key={wordKey}>
                <MorphLetters text={text} />
                <span className="hs-footer-fx">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </span>
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
          <span>© {year} Hackerspace</span>
          {!reduced && (
            <Button
              aria-pressed={paused}
              className="hs-footer-pause"
              onClick={() => setPaused((value) => !value)}
              type="button"
            >
              {paused ? "Reanudar animación" : "Pausar animación"}
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
