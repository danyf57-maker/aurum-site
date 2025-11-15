import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// On récupère les secrets depuis Supabase
const THIRD_PARTY_API_KEY = Deno.env.get("THIRD_PARTY_API_KEY")!;
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",");

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Permet d'autoriser ton site à discuter avec le robot
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Le robot appelle une autre API en utilisant ta clé secrète
  const body = await req.json().catch(() => ({}));
  const response = await fetch("https://api.tiers.com/v1/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${THIRD_PARTY_API_KEY}`,
    },
    body: JSON.stringify({ prompt: body.prompt }),
  });

  const data = await response.json();
  return new Response(JSON.stringify({ result: data.result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
