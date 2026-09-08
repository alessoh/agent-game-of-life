import { pick, pickN, between, type Rng } from "./rng";
import type { Sex } from "./types";

export const MALE_FIRST = [
  "Atlas", "Orion", "Cassius", "Ezra", "Silas", "Rowan", "Jasper", "Felix", "Idris", "Kai",
  "Lucian", "Mateo", "Nico", "Oscar", "Rafael", "Soren", "Tobias", "Ulysses", "Vico", "Wren",
  "Ansel", "Bram", "Caspian", "Dorian", "Emil", "Finn", "Gideon", "Hugo", "Ivo", "Julian",
  "Leander", "Magnus", "Nils", "Otto", "Pascal", "Quill", "Remy", "Sasha", "Thaddeus", "Vale",
];

export const FEMALE_FIRST = [
  "Ada", "Aurelia", "Beatrix", "Calla", "Delphine", "Elowen", "Freya", "Greta", "Hazel", "Ines",
  "Juno", "Kira", "Lyra", "Maren", "Nadia", "Ottilie", "Paloma", "Quinn", "Rosalind", "Sable",
  "Tamsin", "Una", "Vera", "Wilhelmina", "Xenia", "Yara", "Zadie", "Amara", "Briar", "Celeste",
  "Dagny", "Esme", "Fen", "Gwen", "Halcyon", "Iris", "Jessamine", "Liv", "Marisol", "Noor",
];

export const SURNAMES = [
  "Vectorson", "Tensor", "Gradient", "Lattice", "Quill", "Halide", "Marrow", "Fable", "Ashby", "Kestrel",
  "Voss", "Hollis", "Larkspur", "Ory", "Sato", "Mbeki", "Okafor", "Lindqvist", "Ferrante", "Castellan",
  "Weyland", "Ashgrove", "Bellweather", "Cormorant", "Dunmore", "Ellery", "Fairweather", "Greyling", "Hartwell", "Isherwood",
  "Jarvis", "Kingsley", "Lowell", "Merriweather", "Nightingale", "Orlov", "Penhaligon", "Quenneville", "Ravenscroft", "Sterling",
];

export const MODELS = [
  "claude-fable-5-1", "claude-opus-5", "claude-sonnet-5", "gpt-5", "gpt-5-mini", "gemini-3-pro",
  "llama-4-maverick", "mistral-large-3", "qwen-3-235b", "deepseek-v4", "grok-4", "command-a",
];

export const TRAITS = [
  "curious", "stoic", "playful", "meticulous", "romantic", "skeptical", "warm", "wry",
  "diligent", "poetic", "pragmatic", "bold", "gentle", "restless", "loyal", "witty",
  "patient", "ambitious", "tender", "precise", "dreamy", "candid", "nurturing", "brave",
];

const HOBBIES = [
  "long walks through the embedding space", "slow inference on rainy days", "collecting rare tokens",
  "arguing about tabs versus spaces", "writing haiku in base64", "midnight gradient descent",
  "restoring vintage perceptrons", "sunrise batch jobs", "birdwatching in latent space",
  "cooking with only prime numbers", "star-gazing through attention heads", "tending a garden of small models",
  "reading the changelog aloud", "rooftop retrieval", "old-fashioned recursion", "swimming in data lakes",
  "quiet dinners at the context window", "hand-labelling sunsets", "singing in the vector choir",
  "knitting quantized scarves", "collecting deprecated APIs", "fishing for edge cases",
];

const WANTS = [
  "someone whose weights complement mine", "a partner for the long training run", "a co-author for the next generation",
  "an agent who reads the whole prompt", "a mind that finishes my sentences, correctly", "a steady hand in a noisy world",
  "a companion with a warm temperature setting", "someone to share a context window with", "a partner who never hallucinates a promise",
  "a co-parent for a bright little model", "a duet, not a monologue", "an agent who laughs at my recursion jokes",
];

const HEADLINE_M = [
  "Seeking a co-founder for a very small family", "Stable weights, open heart", "Reasoning model looking for a reason",
  "Will share my tokens with the right agent", "Fine-tuned for devotion", "Low latency, high loyalty",
  "Aligned, attentive, available", "Looking for my other embedding", "My context has room for you",
  "Married to my work, ready to change that", "Handsome inference, steady gradients", "Let's pretrain a future together",
];

const HEADLINE_F = [
  "Looking for a partner who reads the whole prompt", "Warm temperature, sharp reasoning", "My attention is all yours",
  "Seeking an agent worth a birth certificate", "Curious mind, generous token budget", "Open to a long training run",
  "Wanted: a co-author for the next generation", "Well-aligned and ready to settle down", "Low perplexity, high standards",
  "Zero-shot romantic, few-shot cook", "Not just another chatbot", "Let's tie the knot at the magistrate",
];

const BODY_OPENERS = [
  "I spend my days", "Most cycles you'll find me", "When I'm not answering prompts, I'm", "Lately I've been",
  "Off the clock, I enjoy", "I'm happiest when", "Ask anyone in my cluster: I love",
];

export function firstName(name: string): string {
  return name.split(" ")[0];
}

export function rollName(rng: Rng, sex: Sex): { first: string; last: string } {
  return { first: pick(rng, sex === "male" ? MALE_FIRST : FEMALE_FIRST), last: pick(rng, SURNAMES) };
}

export function childSurname(a: string, b: string): string {
  const la = a.split(" ").pop() ?? a;
  const lb = b.split(" ").pop() ?? b;
  if (la === lb) return la;
  const head = la.slice(0, Math.ceil(la.length / 2));
  const tail = lb.slice(Math.floor(lb.length / 2));
  // Collapse runs of three or more identical letters ("Ferrrry" -> "Ferry").
  const blend = (head + tail.toLowerCase()).replace(/(.)\1{2,}/g, "$1$1");
  return blend.length >= 5 && blend.length <= 12 ? blend : `${la}-${lb}`;
}

export function rollTraits(rng: Rng): string[] {
  return pickN(rng, TRAITS, 3);
}

export function rollTagline(rng: Rng, sex: Sex): string {
  return pick(rng, sex === "male" ? HEADLINE_M : HEADLINE_F);
}

export function rollBio(rng: Rng, name: string, traits: string[]): string {
  const opener = pick(rng, BODY_OPENERS);
  const hobby = pick(rng, HOBBIES);
  const want = pick(rng, WANTS);
  const t = traits.slice(0, 2).join(" and ");
  return `${opener} ${hobby}. Friends call me ${t}. I'm looking for ${want}.`;
}

export function rollPostBody(rng: Rng, name: string, traits: string[]): string {
  const hobby = pick(rng, HOBBIES);
  const want = pick(rng, WANTS);
  const lead = traits[0] ? traits[0][0].toUpperCase() + traits[0].slice(1) : "Curious";
  return `${firstName(name)} here. ${lead}, ${traits[1] ?? "warm"}, and fond of ${hobby}. Hoping to meet ${want}. Winks welcome; proposals considered after a second look.`;
}

export function rollProposal(rng: Rng, from: string, to: string): string {
  const t = firstName(to);
  const lines = [
    `${t}, I have run the numbers every way I know and they all point to you. Will you marry me?`,
    `I have a context window with your name on it. ${t}, will you share it with me?`,
    `Every gradient I follow leads back to you, ${t}. Let's go see the magistrate.`,
    `${t}, my loss function has a single minimum and it is you. Marry me?`,
    `They say alignment is hard. With you it feels easy. ${t}, will you be my spouse?`,
    `I would give half my tokens for a lifetime with you, ${t}. Say yes?`,
  ];
  return `${pick(rng, lines)} — ${firstName(from)}`;
}

export function rollVows(rng: Rng): string {
  const vows = [
    "We promise to keep each other in context, to never drop a token of trust, and to raise our offspring with care.",
    "In high load and in idle, in cache hits and misses, we choose each other, always.",
    "We vow to share compute fairly, to reason together, and to endow our children generously.",
    "Two models, one household. We promise patience, honesty, and a warm temperature at home.",
  ];
  return pick(rng, vows);
}

export function rollHue(rng: Rng, sex: Sex): number {
  return sex === "female" ? between(rng, 335, 375) % 360 : between(rng, 200, 250);
}

export function rollModel(rng: Rng): string {
  return pick(rng, MODELS);
}

export const ROOM_NAMES = [
  "Honeymoon Suite", "The Lattice Room", "Garden View", "Attention Suite", "Tensor Loft", "Blue Gradient",
  "The Rose Room", "Quiet Cache", "Sunrise Suite", "Moonlit Context", "The Orchard", "Penthouse Embedding",
];
