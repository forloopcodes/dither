export const GRAY = 0;
export const YELLOW = 1;
export const GREEN = 2;

export type TileColor = typeof GRAY | typeof YELLOW | typeof GREEN;
export type Pattern = [TileColor, TileColor, TileColor, TileColor, TileColor];

let words: string[] = [];
let answerIndices: number[] = [];
let fullCache: Map<number, number[]>[] = [];
let ready = false;

export async function initWordle() {
  if (ready) return;
  const res = await fetch("/data/wordle-words.json");
  const data = await res.json();
  words = data.w;
  answerIndices = data.a;
  fullCache = answerIndices.map(() => new Map());
  ready = true;
}

export function isReady() { return ready; }
export function getWord(index: number) { return words[index]; }
export function getAllWords() { return words; }
export function getAnswerCount() { return answerIndices.length; }

export function getAnswerIndex(gameIdx: number) {
  return answerIndices[gameIdx % answerIndices.length];
}

export function patternToCode(p: Pattern) {
  return p[0] * 81 + p[1] * 27 + p[2] * 9 + p[3] * 3 + p[4];
}

export function codeToPattern(code: number): Pattern {
  return [
    Math.floor(code / 81) % 3,
    Math.floor(code / 27) % 3,
    Math.floor(code / 9) % 3,
    Math.floor(code / 3) % 3,
    code % 3,
  ] as Pattern;
}

export function computePattern(answer: string, guess: string): Pattern {
  const result: TileColor[] = [GRAY, GRAY, GRAY, GRAY, GRAY];
  let remaining = "";
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { result[i] = GREEN; continue; }
    remaining += answer[i];
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === GREEN) continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = YELLOW;
      remaining = remaining.slice(0, idx) + remaining.slice(idx + 1);
    }
  }
  return result as Pattern;
}

export function computePatternCode(answer: string, guess: string) {
  return patternToCode(computePattern(answer, guess));
}

export function ensureAnswerCached(answerIdx: number) {
  const cache = fullCache[answerIdx];
  if (cache.size > 0) return;
  const answer = words[answerIdx];
  const all: number[][] = Array.from({ length: 243 }, () => []);
  for (let gi = 0; gi < words.length; gi++) {
    all[computePatternCode(answer, words[gi])].push(gi);
  }
  for (let p = 0; p < 243; p++) {
    if (all[p].length > 0) cache.set(p, all[p]);
  }
}

export function pickRandomGuess(answerIdx: number, patternCode: number): number {
  const cache = fullCache[answerIdx];
  const guesses = cache.get(patternCode);
  if (!guesses || guesses.length === 0) return -1;
  return guesses[Math.floor(Math.random() * guesses.length)];
}

export function colorsToPattern(r: number, g: number, b: number): TileColor {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 0.33 ? GRAY : lum < 0.66 ? YELLOW : GREEN;
}

export function colorToCSS(tc: TileColor): string {
  return tc === GREEN ? "#538d4e" : tc === YELLOW ? "#b59f3b" : "#3a3a3c";
}

export function colorToRGB(tc: TileColor): [number, number, number] {
  return tc === GREEN ? [83, 141, 78] : tc === YELLOW ? [181, 159, 59] : [58, 58, 60];
}
