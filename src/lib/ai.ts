export const GROQ_COMPANION_MODEL = "openai/gpt-oss-120b";

export function getGroqApiKey(): string | undefined {
  const keysStr = process.env.GROQ_API_KEY;
  if (!keysStr) return undefined;

  const keys = keysStr.split(",").map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return undefined;

  // Rotate randomly to balance rate limits across requests
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}
