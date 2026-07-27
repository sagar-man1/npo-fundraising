/**
 * Sends the morning message by driving the real WhatsApp Web UI, so no
 * WhatsApp Business account or Meta-approved template is needed.
 *
 * Two drivers behind one interface:
 *   playwright    — deterministic, near-free, what you want running daily
 *   computer-use  — Claude looks at screenshots and clicks; slower and costs
 *                   tokens per run, but survives a WhatsApp UI change that
 *                   breaks the selectors above
 *
 * Both reuse a logged-in browser profile on disk, so you scan the QR code once.
 */

import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";

export type WhatsAppDriver = "playwright" | "computer-use";

export class WhatsAppConfigError extends Error {}

export type WhatsAppTarget = {
  /** Contact name exactly as it appears in the WhatsApp chat list. */
  contact: string;
  message: string;
};

function profileDir() {
  return (
    process.env.WHATSAPP_PROFILE_DIR ??
    path.join(process.cwd(), ".whatsapp-profile")
  );
}

export function whatsappContact() {
  const contact = process.env.WHATSAPP_CONTACT;
  if (!contact) {
    throw new WhatsAppConfigError(
      "WHATSAPP_CONTACT is not set. Put the contact name exactly as it appears in your WhatsApp chat list into .env.",
    );
  }
  return contact;
}

export function whatsappDriver(): WhatsAppDriver {
  const driver = process.env.WHATSAPP_DRIVER ?? "playwright";
  if (driver !== "playwright" && driver !== "computer-use") {
    throw new WhatsAppConfigError(
      `WHATSAPP_DRIVER must be "playwright" or "computer-use", got "${driver}".`,
    );
  }
  return driver;
}

/**
 * Drives web.whatsapp.com directly. Runs headed by default — WhatsApp Web is
 * less likely to challenge a visible session, and on an always-on Mac mini
 * there is no cost to showing the window.
 */
async function sendViaPlaywright({ contact, message }: WhatsAppTarget) {
  const { chromium } = await import("playwright");

  const context = await chromium.launchPersistentContext(profileDir(), {
    headless: process.env.WHATSAPP_HEADLESS === "true",
    viewport: { width: 1280, height: 900 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded" });

    const searchBox = page.getByRole("textbox", { name: /search/i }).first();
    try {
      await searchBox.waitFor({ state: "visible", timeout: 60_000 });
    } catch {
      throw new Error(
        "WhatsApp Web is not logged in on this profile. Run `npm run whatsapp:login` once and scan the QR code.",
      );
    }

    await searchBox.click();
    await searchBox.fill(contact);
    await page.waitForTimeout(1500);

    const chat = page.getByRole("listitem").filter({ hasText: contact }).first();
    await chat.waitFor({ state: "visible", timeout: 15_000 });
    await chat.click();

    const composer = page
      .getByRole("textbox", { name: /type a message/i })
      .first();
    await composer.waitFor({ state: "visible", timeout: 15_000 });
    await composer.click();

    // Shift+Enter keeps multi-line formatting instead of sending each line.
    for (const [index, line] of message.split("\n").entries()) {
      if (index > 0) await page.keyboard.press("Shift+Enter");
      await page.keyboard.type(line);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2500);
  } finally {
    await context.close();
  }
}

/**
 * Screenshot-and-click fallback. Kept deliberately small: it exists so a
 * WhatsApp redesign doesn't take the morning brief offline until someone
 * updates the selectors above.
 */
async function sendViaComputerUse({ contact, message }: WhatsAppTarget) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new WhatsAppConfigError(
      "ANTHROPIC_API_KEY is required for the computer-use WhatsApp driver.",
    );
  }

  const [{ default: Anthropic }, { chromium }] = await Promise.all([
    import("@anthropic-ai/sdk"),
    import("playwright"),
  ]);

  const client = new Anthropic();
  const width = 1280;
  const height = 900;

  const context = await chromium.launchPersistentContext(profileDir(), {
    headless: false,
    viewport: { width, height },
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    const screenshot = async () =>
      (await page.screenshot({ type: "png" })).toString("base64");

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `This is a logged-in WhatsApp Web window on the user's own machine. Send the user's own daily brief to their chat with "${contact}".

Steps: click the search box, type the contact name, open that chat, click the message composer, type the message, press Enter to send. Then stop and say DONE.

Message to send (type it exactly, using shift+Enter for line breaks so it sends as one message):

${message}`,
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: await screenshot() },
          },
        ],
      },
    ];

    for (let turn = 0; turn < 25; turn += 1) {
      const response = await client.beta.messages.create({
        model: "claude-opus-5",
        max_tokens: 4096,
        betas: ["computer-use-2025-11-24"],
        tools: [
          {
            type: "computer_20251124",
            name: "computer",
            display_width_px: width,
            display_height_px: height,
          },
        ],
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
          .map((block) => block.text)
          .join(" ");
        if (/done/i.test(text)) return;
        throw new Error(`Computer-use driver stopped without sending: ${text.slice(0, 300)}`);
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        await applyComputerAction(page, block.input as Record<string, unknown>);
        await page.waitForTimeout(600);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: await screenshot() },
            },
          ],
        });
      }
      messages.push({ role: "user", content: results });
    }

    throw new Error("Computer-use driver ran out of turns before sending.");
  } finally {
    await context.close();
  }
}

type Page = Awaited<ReturnType<Awaited<ReturnType<typeof import("playwright").chromium.launchPersistentContext>>["newPage"]>>;

async function applyComputerAction(page: Page, input: Record<string, unknown>) {
  const action = String(input.action ?? "");
  const coordinate = Array.isArray(input.coordinate)
    ? (input.coordinate as number[])
    : undefined;

  switch (action) {
    case "screenshot":
      return;
    case "left_click":
    case "double_click":
      if (!coordinate) return;
      await page.mouse.click(coordinate[0], coordinate[1], {
        clickCount: action === "double_click" ? 2 : 1,
      });
      return;
    case "mouse_move":
      if (coordinate) await page.mouse.move(coordinate[0], coordinate[1]);
      return;
    case "type":
      await page.keyboard.type(String(input.text ?? ""));
      return;
    case "key":
      await page.keyboard.press(normaliseKey(String(input.text ?? "")));
      return;
    case "scroll":
      await page.mouse.wheel(0, Number(input.scroll_amount ?? 3) * 100);
      return;
    case "wait":
      await page.waitForTimeout(Number(input.duration ?? 1) * 1000);
      return;
    default:
      return;
  }
}

/** xdotool-style key names to Playwright key names. */
function normaliseKey(key: string) {
  return key
    .split("+")
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "return" || lower === "enter") return "Enter";
      if (lower === "shift") return "Shift";
      if (lower === "ctrl" || lower === "control") return "Control";
      if (lower === "alt") return "Alt";
      if (lower === "super" || lower === "cmd" || lower === "meta") return "Meta";
      if (lower === "escape" || lower === "esc") return "Escape";
      if (lower === "tab") return "Tab";
      if (lower === "backspace") return "Backspace";
      return part.length === 1 ? part : part[0].toUpperCase() + part.slice(1);
    })
    .join("+");
}

export async function sendWhatsApp(target: WhatsAppTarget) {
  const driver = whatsappDriver();
  if (driver === "computer-use") return sendViaComputerUse(target);
  return sendViaPlaywright(target);
}
