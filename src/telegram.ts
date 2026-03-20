import { DateTime } from "luxon";
import type { ParsedOffer } from "./parse.js";
import { formatSalary } from "./parse.js";

const API = `https://api.telegram.org/bot${process.env["TELEGRAM_TOKEN"]}`;

const CHAT_IDS: string[] = (process.env["TELEGRAM_CHAT_ID"] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function sendMessage(chatId: string, text: string): Promise<void> {
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram error ${res.status} (chat ${chatId}): ${body}`);
  }
}

function formatLanguage(lang: { code: string; level: string }): string {
  const base = `${lang.code.toLowerCase()} ${lang.level}`;
  return lang.code.toLowerCase() === "pl" ? `${base} 🇵🇱` : base;
}

function formatOffer(offer: ParsedOffer): string {
  const promoted = offer.isPromoted ? " ★" : "";
  const skills = offer.requiredSkills.length ? offer.requiredSkills.join(", ") : "—";
  const age = Math.round((Date.now() - offer.publishedAt.getTime()) / 3_600_000);
  const dt = DateTime.fromJSDate(offer.publishedAt).setZone("Europe/Warsaw");
  const date = `${dt.toFormat("yyyy-MM-dd HH:mm")} ${dt.toFormat("ZZZZ")}`;

  const langs = offer.languages.length
    ? offer.languages.map(formatLanguage).join(", ")
    : null;

  return [
    `<b>${offer.title}</b>${promoted} @ ${offer.company}`,
    `📍 ${offer.city} · ${offer.workplaceType}`,
    offer.salary.length ? `\n${formatSalary(offer.salary)}` : null,
    `🛠 ${skills}`,
    langs ? `🌐 ${langs}` : null,
    `🕐 ${date} (${age}h ago)`,
    `<a href="${offer.url}">View Full Description</a>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyBatch(offers: ParsedOffer[]): Promise<void> {
  for (const offer of offers) {
    const text = formatOffer(offer);
    for (const chatId of CHAT_IDS) {
      await sendMessage(chatId, text);
    }
  }
}
