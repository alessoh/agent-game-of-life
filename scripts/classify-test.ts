import { classifyUserAgent, shouldRecord, isAction, describePath } from "../src/lib/visitors";

const CASES: [string, string, string][] = [
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot", "ai-crawler", "GPTBot"],
  ["Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "ai-crawler", "ClaudeBot"],
  ["Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", "ai-crawler", "PerplexityBot"],
  ["Mozilla/5.0 (compatible; CCBot/2.0; +https://commoncrawl.org/faq/)", "ai-crawler", "CCBot"],
  ["Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36; compatible; ChatGPT-User/1.0; +https://openai.com/bot", "ai-agent", "ChatGPT-User"],
  ["python-requests/2.32.3", "ai-agent", "python-requests"],
  ["LangChain/0.3.7 python-httpx/0.27", "ai-agent", "LangChain"],
  ["curl/8.4.0", "ai-agent", "curl"],
  ["node-fetch/1.0 (+https://github.com/bitinn/node-fetch)", "ai-agent", "node-fetch"],
  ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36", "ai-agent", "Headless Chrome"],
  ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "search-crawler", "Googlebot"],
  ["Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "search-crawler", "Bingbot"],
  ["Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)", "social", "Slackbot"],
  ["Twitterbot/1.0", "social", "Twitterbot"],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "browser", "Safari"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "browser", "Chrome"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0", "browser", "Firefox"],
  ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0", "browser", "Edge"],
  ["TotallyNewCrawler/0.1 (+https://example.com/bot)", "unknown", "TotallyNewCrawler"],
  ["", "unknown", "No user agent"],
];

let failed = 0;
for (const [ua, wantClass, wantName] of CASES) {
  const got = classifyUserAgent(ua);
  const ok = got.class === wantClass && got.name === wantName;
  if (!ok) { failed++; console.log(`FAIL  ${ua.slice(0, 50)}\n      want ${wantClass}/${wantName}  got ${got.class}/${got.name}`); }
}
console.log(`classification: ${CASES.length - failed}/${CASES.length} passed`);

// Recording filters
const browser = classifyUserAgent("Mozilla/5.0 Chrome/120 Safari/537.36");
const bot = classifyUserAgent("GPTBot/1.2");
const filters: [boolean, boolean, string][] = [
  [shouldRecord(browser, "/_next/static/x.js"), false, "assets never recorded"],
  [shouldRecord(browser, "/api/state"), false, "browser polling skipped"],
  [shouldRecord(bot, "/api/state"), true, "agent hitting the API is recorded"],
  [shouldRecord(browser, "/board"), true, "browser page view recorded"],
  [isAction("POST", "/api/agents"), true, "registration is an action"],
  [isAction("GET", "/api/agents"), false, "reading is not an action"],
  [isAction("POST", "/api/tick"), false, "ticks are not an action"],
];
for (const [got, want, label] of filters) {
  if (got !== want) { failed++; console.log(`FAIL  ${label}: want ${want} got ${got}`); }
}
console.log(`filters: ${filters.length} checked`);
console.log(`describePath: "${describePath("POST", "/api/agents")}" | "${describePath("GET", "/llms.txt")}"`);
console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
