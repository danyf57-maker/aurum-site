// Aurum Insight – DeepSeek + cache Supabase (avec logs et insert robuste)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

type JournalEntry = {
  text: string;
  timestamp: number;
};

type InsightPayload = {
  last_entry_ts?: number;
};

type InsightResult = {
  summary: string;
  micro_action: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FALLBACK_INSIGHT: InsightResult = {
  summary:
    "Je n’arrive pas à analyser ton journal pour le moment, mais ce que tu as écrit reste précieux. Rien n’est perdu.",
  micro_action:
    "Ajoute une ou deux phrases à ton journal, puis reviens plus tard : je te proposerai une micro-action dès que possible.",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function getEnvOrNull(name: string): string | null {
  try {
    return Deno.env.get(name) ?? null;
  } catch {
    return null;
  }
}

function buildPromptFromJournal(entries: JournalEntry[]): string {
  if (!entries.length) {
    return `
Tu es un coach bienveillant.
L’utilisateur n’a pas encore écrit d’entrées de journal exploitables.
Retourne simplement un résumé très général et une micro-action simple pour l’aider à se poser.
`.trim();
  }

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  const formatted = sorted
    .map((e, idx) => {
      const date = new Date(e.timestamp).toISOString().slice(0, 10);
      const safeText = (e.text ?? "").toString().slice(0, 300);
      return `${idx + 1}. [${date}] ${safeText}`;
    })
    .join("\n");

  return `
Tu es un coach bienveillant qui analyse le journal d’un utilisateur en transition professionnelle (commercial / entrepreneur).
Tu dois retourner STRICTEMENT un JSON de la forme :
{
  "summary": "…",
  "micro_action": "…"
}

Règles :
- Écris en français.
- Garde un ton soutenant, concret, jamais culpabilisant.
- La micro-action doit être réalisable en moins de 15 minutes.

Voici ses dernières entrées de journal, de la plus ancienne à la plus récente :

${formatted}
`.trim();
}

async function callDeepSeek(
  apiKey: string,
  prompt: string,
): Promise<{ insight: InsightResult | null; usage: any; model: string }> {
  const body = {
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Tu es un coach qui résume le journal d’une personne et lui propose une micro-action concrète.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 512,
  };

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(
      "[aurum-insight] DeepSeek HTTP error:",
      res.status,
      txt.slice(0, 300),
    );
    return { insight: null, usage: null, model: "deepseek-chat" };
  }

  const data = await res.json();
  console.log("[aurum-insight] DeepSeek raw response usage:", data.usage);

  const model = data.model ?? "deepseek-chat";
  const usage = data.usage ?? null;

  let insight: InsightResult | null = null;
  try {
    const content = data.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      const summary =
        (parsed.summary && String(parsed.summary).trim()) || null;
      const micro =
        (parsed.micro_action && String(parsed.micro_action).trim()) || null;

      if (summary && micro) {
        insight = { summary, micro_action: micro };
      } else {
        console.warn("[aurum-insight] DeepSeek JSON incomplet:", parsed);
      }
    } else {
      console.warn(
        "[aurum-insight] DeepSeek content non-string:",
        typeof content,
      );
    }
  } catch (e) {
    console.error("[aurum-insight] JSON parse error:", e);
  }

  return { insight, usage, model };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl = getEnvOrNull("SUPABASE_URL");
  const supabaseAnonKey = getEnvOrNull("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = getEnvOrNull("SUPABASE_SERVICE_ROLE_KEY");
  const deepseekKey = getEnvOrNull("DEEPSEEK_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error("[aurum-insight] Missing Supabase env vars");
    return jsonResponse(FALLBACK_INSIGHT);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1];

  if (!accessToken) {
    console.error("[aurum-insight] Missing Authorization Bearer token");
    return jsonResponse(FALLBACK_INSIGHT);
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    console.error("[aurum-insight] auth.getUser error:", userError);
    return jsonResponse(FALLBACK_INSIGHT);
  }

  const userId = user.id;
  console.log("[aurum-insight] Authenticated user:", userId);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  let lastEntryFromClient: number | undefined;
  try {
    const payload = (await req.json()) as InsightPayload;
    if (
      payload &&
      typeof payload.last_entry_ts === "number" &&
      Number.isFinite(payload.last_entry_ts)
    ) {
      lastEntryFromClient = payload.last_entry_ts;
    }
    console.log(
      "[aurum-insight] Payload last_entry_ts:",
      lastEntryFromClient,
    );
  } catch {
    console.log("[aurum-insight] No JSON body or invalid payload");
  }

  let journalEntries: JournalEntry[] = [];
  let latestTs: number | undefined = lastEntryFromClient;

  try {
    const { data, error } = await supabaseAdmin
      .from("aurum_answers")
      .select("text, timestamp")
      .eq("user_id", userId)
      .eq("type", "journal")
      .order("timestamp", { ascending: false })
      .limit(7);

    if (error) {
      console.error("[aurum-insight] aurum_answers select error:", error);
    } else if (data && data.length > 0) {
      journalEntries = data.map((row: any) => ({
        text: row.text ?? "",
        timestamp: Number(row.timestamp) || 0,
      }));
      console.log(
        "[aurum-insight] Journal entries fetched:",
        journalEntries.length,
      );

      if (!latestTs) {
        latestTs = Number(data[0].timestamp) || undefined;
      }
    } else {
      console.log("[aurum-insight] No journal entries found for user.");
    }
  } catch (e) {
    console.error("[aurum-insight] journal fetch exception:", e);
  }

  if (!latestTs) {
    latestTs = Date.now();
    console.log(
      "[aurum-insight] latestTs undefined, using Date.now():",
      latestTs,
    );
  }

  let finalInsight: InsightResult = FALLBACK_INSIGHT;
  let usage: any = null;
  let modelUsed = "deepseek-chat";

  if (!deepseekKey) {
    console.error("[aurum-insight] Missing DEEPSEEK_API_KEY");
  } else {
    const prompt = buildPromptFromJournal(journalEntries);
    const result = await callDeepSeek(deepseekKey, prompt);
    if (result.insight) {
      finalInsight = result.insight;
    } else {
      console.warn(
        "[aurum-insight] No valid insight from DeepSeek, using fallback.",
      );
    }
    usage = result.usage;
    modelUsed = result.model || "deepseek-chat";
  }

  try {
    console.log("[aurum-insight] Attempting INSERT in aurum_insights…", {
      user_id: userId,
      last_entry_ts: latestTs,
      model: modelUsed,
    });

    const tokensIn = usage?.prompt_tokens ?? null;
    const tokensOut = usage?.completion_tokens ?? null;

    const { error: insertError } = await supabaseAdmin
      .from("aurum_insights")
      .insert({
        user_id: userId,
        last_entry_ts: latestTs,
        summary: finalInsight.summary,
        micro_action: finalInsight.micro_action,
        model: modelUsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
      });

    if (insertError) {
      console.error(
        "[aurum-insight] INSERT aurum_insights error:",
        insertError,
      );
    } else {
      console.log("[aurum-insight] INSERT aurum_insights OK");
    }
  } catch (e) {
    console.error("[aurum-insight] DB insert exception:", e);
  }

  return jsonResponse(finalInsight);
});
