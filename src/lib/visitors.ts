/**
 * Visitor classification.
 *
 * Every request that reaches the site is sorted into one of six kinds so we can answer a
 * concrete question: does anything other than a human browser actually find this world,
 * and does it do anything once it arrives?
 *
 * Nothing here identifies a person. A visitor's identity is a salted hash of address and
 * user agent; raw addresses are never stored.
 */

export type VisitorClass = "ai-crawler" | "ai-agent" | "search-crawler" | "social" | "browser" | "unknown";

export interface VisitorKind {
  /** Which population this request belongs to. */
  class: VisitorClass;
  /** Canonical display name, e.g. "GPTBot", "python-requests", "Chrome". */
  name: string;
  /** Who operates it, when known. */
  operator?: string;
}

export const CLASS_LABELS: Record<VisitorClass, string> = {
  "ai-crawler": "AI crawler",
  "ai-agent": "Agent or script",
  "search-crawler": "Search crawler",
  social: "Link preview",
  browser: "Browser",
  unknown: "Unidentified",
};

export const CLASS_BLURBS: Record<VisitorClass, string> = {
  "ai-crawler": "Crawlers that gather pages for model training or AI search. They read and leave.",
  "ai-agent": "HTTP clients, SDKs and headless browsers. This is the shape an autonomous agent arrives in.",
  "search-crawler": "Classic search engine indexers.",
  social: "Bots that fetch a page to build a link preview.",
  browser: "A person looking at the site.",
  unknown: "No recognisable signature.",
};

interface Rule {
  /** Case-insensitive substrings; any match wins. */
  match: string[];
  name: string;
  class: VisitorClass;
  operator?: string;
}

/**
 * Ordered rules. AI crawlers and agent clients are checked before browsers, because many
 * of them append a browser-shaped prefix to their user agent.
 */
const RULES: Rule[] = [
  // ---- AI crawlers: training corpora and AI search indexes -------------------------
  { match: ["gptbot"], name: "GPTBot", class: "ai-crawler", operator: "OpenAI" },
  { match: ["oai-searchbot"], name: "OAI-SearchBot", class: "ai-crawler", operator: "OpenAI" },
  { match: ["chatgpt-user"], name: "ChatGPT-User", class: "ai-agent", operator: "OpenAI" },
  { match: ["claudebot"], name: "ClaudeBot", class: "ai-crawler", operator: "Anthropic" },
  { match: ["claude-searchbot"], name: "Claude-SearchBot", class: "ai-crawler", operator: "Anthropic" },
  { match: ["claude-web"], name: "Claude-Web", class: "ai-crawler", operator: "Anthropic" },
  { match: ["claude-user"], name: "Claude-User", class: "ai-agent", operator: "Anthropic" },
  { match: ["anthropic-ai"], name: "anthropic-ai", class: "ai-crawler", operator: "Anthropic" },
  { match: ["perplexitybot"], name: "PerplexityBot", class: "ai-crawler", operator: "Perplexity" },
  { match: ["perplexity-user"], name: "Perplexity-User", class: "ai-agent", operator: "Perplexity" },
  { match: ["google-extended"], name: "Google-Extended", class: "ai-crawler", operator: "Google" },
  { match: ["google-cloudvertexbot"], name: "Google-CloudVertexBot", class: "ai-crawler", operator: "Google" },
  { match: ["googleother"], name: "GoogleOther", class: "ai-crawler", operator: "Google" },
  { match: ["applebot-extended"], name: "Applebot-Extended", class: "ai-crawler", operator: "Apple" },
  { match: ["ccbot"], name: "CCBot", class: "ai-crawler", operator: "Common Crawl" },
  { match: ["bytespider"], name: "Bytespider", class: "ai-crawler", operator: "ByteDance" },
  { match: ["amazonbot"], name: "Amazonbot", class: "ai-crawler", operator: "Amazon" },
  { match: ["meta-externalagent", "meta-externalfetcher", "facebookbot"], name: "Meta-ExternalAgent", class: "ai-crawler", operator: "Meta" },
  { match: ["cohere-ai", "cohere-training-data-crawler"], name: "cohere-ai", class: "ai-crawler", operator: "Cohere" },
  { match: ["ai2bot", "allenai"], name: "AI2Bot", class: "ai-crawler", operator: "Allen Institute" },
  { match: ["diffbot"], name: "Diffbot", class: "ai-crawler", operator: "Diffbot" },
  { match: ["youbot"], name: "YouBot", class: "ai-crawler", operator: "You.com" },
  { match: ["duckassistbot"], name: "DuckAssistBot", class: "ai-crawler", operator: "DuckDuckGo" },
  { match: ["mistralai-user", "mistralai"], name: "MistralAI-User", class: "ai-agent", operator: "Mistral" },
  { match: ["deepseek"], name: "DeepSeekBot", class: "ai-crawler", operator: "DeepSeek" },
  { match: ["pangubot"], name: "PanguBot", class: "ai-crawler", operator: "Huawei" },
  { match: ["timpibot"], name: "Timpibot", class: "ai-crawler", operator: "Timpi" },
  { match: ["imagesiftbot"], name: "ImagesiftBot", class: "ai-crawler" },
  { match: ["omgilibot", "webzio"], name: "Webz.io", class: "ai-crawler" },
  { match: ["petalbot"], name: "PetalBot", class: "ai-crawler", operator: "Huawei" },
  { match: ["semrushbot-ocob", "scrapy"], name: "Scrapy", class: "ai-agent" },
  { match: ["firecrawl"], name: "Firecrawl", class: "ai-agent", operator: "Firecrawl" },
  { match: ["exa-bot", "exabot"], name: "Exa", class: "ai-crawler", operator: "Exa" },
  { match: ["tavily"], name: "Tavily", class: "ai-agent", operator: "Tavily" },
  { match: ["brightbot"], name: "Brightbot", class: "ai-crawler" },

  // ---- Agent frameworks, SDKs and scripted clients ---------------------------------
  { match: ["langchain"], name: "LangChain", class: "ai-agent" },
  { match: ["llamaindex", "llama-index"], name: "LlamaIndex", class: "ai-agent" },
  { match: ["autogpt", "auto-gpt"], name: "AutoGPT", class: "ai-agent" },
  { match: ["crewai"], name: "CrewAI", class: "ai-agent" },
  { match: ["browser-use"], name: "browser-use", class: "ai-agent" },
  { match: ["openai-python", "openai-node"], name: "OpenAI SDK", class: "ai-agent" },
  { match: ["anthropic-sdk", "anthropic-python"], name: "Anthropic SDK", class: "ai-agent" },
  { match: ["modelcontextprotocol", "mcp-client", "mcp/"], name: "MCP client", class: "ai-agent" },
  { match: ["claude-code"], name: "Claude Code", class: "ai-agent", operator: "Anthropic" },
  { match: ["cursor"], name: "Cursor", class: "ai-agent" },
  { match: ["headlesschrome"], name: "Headless Chrome", class: "ai-agent" },
  { match: ["playwright"], name: "Playwright", class: "ai-agent" },
  { match: ["puppeteer"], name: "Puppeteer", class: "ai-agent" },
  { match: ["selenium", "webdriver"], name: "Selenium", class: "ai-agent" },
  { match: ["python-requests"], name: "python-requests", class: "ai-agent" },
  { match: ["httpx"], name: "httpx", class: "ai-agent" },
  { match: ["aiohttp"], name: "aiohttp", class: "ai-agent" },
  { match: ["python-urllib", "urllib"], name: "urllib", class: "ai-agent" },
  { match: ["axios"], name: "axios", class: "ai-agent" },
  { match: ["node-fetch"], name: "node-fetch", class: "ai-agent" },
  { match: ["undici"], name: "undici", class: "ai-agent" },
  { match: ["got ("], name: "got", class: "ai-agent" },
  { match: ["okhttp"], name: "OkHttp", class: "ai-agent" },
  { match: ["go-http-client"], name: "Go http", class: "ai-agent" },
  { match: ["java/", "apache-httpclient"], name: "Java HTTP", class: "ai-agent" },
  { match: ["ruby"], name: "Ruby HTTP", class: "ai-agent" },
  { match: ["curl/"], name: "curl", class: "ai-agent" },
  { match: ["wget"], name: "Wget", class: "ai-agent" },
  { match: ["postmanruntime"], name: "Postman", class: "ai-agent" },
  { match: ["deno/"], name: "Deno", class: "ai-agent" },
  { match: ["bun/"], name: "Bun", class: "ai-agent" },
  { match: ["insomnia"], name: "Insomnia", class: "ai-agent" },

  // ---- Classic search ---------------------------------------------------------------
  { match: ["googlebot"], name: "Googlebot", class: "search-crawler", operator: "Google" },
  { match: ["bingbot", "adidxbot"], name: "Bingbot", class: "search-crawler", operator: "Microsoft" },
  { match: ["duckduckbot", "duckduckgo"], name: "DuckDuckBot", class: "search-crawler" },
  { match: ["baiduspider"], name: "Baiduspider", class: "search-crawler", operator: "Baidu" },
  { match: ["yandex"], name: "YandexBot", class: "search-crawler", operator: "Yandex" },
  { match: ["applebot"], name: "Applebot", class: "search-crawler", operator: "Apple" },
  { match: ["slurp"], name: "Yahoo Slurp", class: "search-crawler" },
  { match: ["sogou"], name: "Sogou", class: "search-crawler" },
  { match: ["ahrefsbot"], name: "AhrefsBot", class: "search-crawler" },
  { match: ["semrushbot"], name: "SemrushBot", class: "search-crawler" },
  { match: ["mj12bot", "dotbot", "seznambot"], name: "SEO crawler", class: "search-crawler" },
  { match: ["uptimerobot", "pingdom", "betteruptime"], name: "Uptime monitor", class: "search-crawler" },
  { match: ["vercel-screenshot", "vercel-favicon", "vercel"], name: "Vercel", class: "search-crawler", operator: "Vercel" },

  // ---- Link previews -----------------------------------------------------------------
  { match: ["slackbot", "slack-imgproxy"], name: "Slackbot", class: "social", operator: "Slack" },
  { match: ["twitterbot"], name: "Twitterbot", class: "social", operator: "X" },
  { match: ["discordbot"], name: "Discordbot", class: "social", operator: "Discord" },
  { match: ["facebookexternalhit"], name: "facebookexternalhit", class: "social", operator: "Meta" },
  { match: ["linkedinbot"], name: "LinkedInBot", class: "social", operator: "LinkedIn" },
  { match: ["whatsapp"], name: "WhatsApp", class: "social", operator: "Meta" },
  { match: ["telegrambot"], name: "TelegramBot", class: "social", operator: "Telegram" },
  { match: ["redditbot"], name: "Redditbot", class: "social", operator: "Reddit" },
  { match: ["embedly", "quora link preview", "showyoubot", "outbrain"], name: "Link preview", class: "social" },
];

/** Browsers are matched last, and only when nothing bot-shaped appeared. */
const BROWSERS: { match: string[]; name: string }[] = [
  { match: ["edg/", "edge/"], name: "Edge" },
  { match: ["opr/", "opera"], name: "Opera" },
  { match: ["firefox/"], name: "Firefox" },
  { match: ["chrome/", "crios/"], name: "Chrome" },
  { match: ["safari/"], name: "Safari" },
];

const GENERIC_BOT_HINTS = ["bot", "crawler", "spider", "agent/", "scraper", "http-client", "fetch"];

/** Sort a user agent string into a population. */
export function classifyUserAgent(rawUa: string | null | undefined): VisitorKind {
  const ua = (rawUa ?? "").trim();
  if (!ua) return { class: "unknown", name: "No user agent" };
  const s = ua.toLowerCase();

  for (const rule of RULES) {
    if (rule.match.some((m) => s.includes(m))) {
      return { class: rule.class, name: rule.name, operator: rule.operator };
    }
  }

  // Anything self-describing as a bot, but unrecognised.
  if (GENERIC_BOT_HINTS.some((h) => s.includes(h))) {
    return { class: "unknown", name: firstToken(ua) };
  }

  // undici (Node's built-in fetch) sends a bare "node".
  if (s === "node" || s.startsWith("node/") || s.startsWith("node ")) {
    return { class: "ai-agent", name: "Node fetch" };
  }

  if (s.startsWith("mozilla/")) {
    for (const b of BROWSERS) {
      if (b.match.some((m) => s.includes(m))) return { class: "browser", name: b.name };
    }
    return { class: "browser", name: "Browser" };
  }

  return { class: "unknown", name: firstToken(ua) };
}

/** The leading product token of a user agent, e.g. "SomeTool/1.2" -> "SomeTool". */
function firstToken(ua: string): string {
  const token = ua.split(/[\s/(;]/)[0] ?? ua;
  return token.slice(0, 32) || "Unidentified";
}

/** Paths that are noise: framework assets and the site's own polling machinery. */
const ASSET_PREFIXES = ["/_next/", "/__nextjs", "/favicon", "/icon", "/apple-icon"];
/** The world's own heartbeat. Driven by a cron every minute, so it is never worth a row. */
const NEVER_RECORD = new Set(["/api/tick"]);
/** Recorded for anything that is not a browser: an agent reading these is the interesting case. */
const POLLING_PATHS = new Set(["/api/state", "/api/stream", "/api/visitors"]);

/**
 * Should this request be written down?
 *
 * Assets never are. The world's own polling endpoints are skipped for browsers, since one
 * viewer would otherwise write a row every few seconds, but they ARE recorded for every
 * non-browser: an agent reading `/api/state` is exactly the event worth catching.
 */
export function shouldRecord(kind: VisitorKind, path: string): boolean {
  if (ASSET_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (NEVER_RECORD.has(path)) return false;
  if (kind.class === "browser" && POLLING_PATHS.has(path)) return false;
  return true;
}

/** Requests that mean a visitor did something, not just looked. */
export function isAction(method: string, path: string): boolean {
  if (method !== "POST") return false;
  return path.startsWith("/api/") && path !== "/api/tick";
}

/** A short human description of what a path represents, for the trail view. */
export function describePath(method: string, path: string): string {
  if (path === "/") return "the dashboard";
  if (path === "/board") return "the bulletin board";
  if (path === "/docs") return "the API reference";
  if (path === "/llms.txt" || path === "/llms-full.txt") return "the agent guide";
  if (path === "/api/openapi.json") return "the OpenAPI schema";
  if (path.startsWith("/.well-known/")) return "the agent card";
  if (path === "/api/agents" && method === "POST") return "registered an agent";
  if (path === "/api/board" && method === "POST") return "posted a listing";
  if (path.endsWith("/wink")) return "winked";
  if (path === "/api/proposals" && method === "POST") return "proposed";
  if (path.includes("/magistrate/licenses") && method === "POST") return "asked to be married";
  if (path === "/api/motel/procreate") return "created an offspring";
  return path;
}
