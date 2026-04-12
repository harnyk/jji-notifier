import "reflect-metadata";
import { DateTime } from "luxon";
import { injectable } from "inversify";
import type { ParsedOffer } from "../../domain/parse.js";
import { formatSalary } from "../../domain/parse.js";
import type { INotificationSender } from "../../ports/INotificationSender.js";

@injectable()
export class TelegramNotificationSender implements INotificationSender {
  private readonly api: string;
  private readonly chatIds: string[];

  constructor() {
    this.api = `https://api.telegram.org/bot${process.env["TELEGRAM_TOKEN"]}`;
    this.chatIds = (process.env["TELEGRAM_CHAT_ID"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    const res = await fetch(`${this.api}/sendMessage`, {
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

  private formatOffer(offer: ParsedOffer): string {
    const promoted = offer.isPromoted ? " ★" : "";
    const skills = offer.requiredSkills.length ? offer.requiredSkills.join(", ") : "—";
    const age = Math.round((Date.now() - offer.publishedAt.getTime()) / 3_600_000);
    const dt = DateTime.fromJSDate(offer.publishedAt).setZone("Europe/Warsaw");
    const date = `${dt.toFormat("yyyy-MM-dd HH:mm")} ${dt.toFormat("ZZZZ")}`;

    const langs = offer.languages.length
      ? offer.languages.map((lang) => {
          const base = `${lang.code.toLowerCase()} ${lang.level}`;
          return lang.code.toLowerCase() === "pl" ? `${base} 🇵🇱` : base;
        }).join(", ")
      : null;

    return [
      offer.queryLabel ? `🔍 <i>${offer.queryLabel}</i>` : null,
      `<b>${offer.title}</b>${promoted} @ ${offer.company}`,
      `📍 ${offer.city} · ${offer.workplaceType}`,
      offer.salary.length ? `\n${formatSalary(offer.salary)}\n` : null,
      `🛠 ${skills}`,
      langs ? `🌐 ${langs}` : null,
      '',
      `🕐 ${date} (${age}h ago)`,
      '',
      `<a href="${offer.url}">View Full Description</a>`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async sendBatch(offers: ParsedOffer[]): Promise<void> {
    for (const offer of offers) {
      const text = this.formatOffer(offer);
      for (const chatId of this.chatIds) {
        await this.sendMessage(chatId, text);
      }
    }
  }
}
