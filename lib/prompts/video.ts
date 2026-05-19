import type { VideoAnimationConfig } from '@/types';

type VideoPromptConfig = Pick<VideoAnimationConfig, 'aspectRatio' | 'durationSeconds'>;

export function buildVideoScriptPrompt(config: VideoPromptConfig): string {
  const duration = config?.durationSeconds || 30;
  const ratio = config?.aspectRatio || '9:16';

  return `You are scripting a short, animated explainer video — think "Kurzgesagt meets Fireship": dense information, fast pacing, one clear visual idea per scene. No walls of text.

The video is ${duration} seconds long, ${ratio} aspect ratio, and has exactly 5 scenes.

Research the topic, then write a 5-scene script. Return ONLY raw JSON (no markdown fences, no commentary) matching this exact schema:

{
  "title": "string — internal name for the video",
  "scenes": [
    {
      "template": "title" | "flowchart" | "stat" | "iconGrid" | "diagram" | "particles",
      "eyebrow": "string — optional 1-3 word kicker, UPPERCASE works well",
      "headline": "string — max 8 words, the core idea of the scene",
      "body": "string — 1-2 short sentences, max 180 characters, plain language",
      "cta": "string — only for the final scene: the call to action",
      "steps": ["string", ...],
      "items": [{ "icon": "single emoji", "label": "string — max 4 words" }],
      "stat": { "value": number, "prefix": "string optional", "suffix": "string optional", "label": "string" },
      "diagram": { "centerLabel": "string", "nodes": ["string", ...] }
    }
  ]
}

RULES:
- Scene 1 MUST use template "title" (the hook). Scene 5 MUST use template "particles" (the payoff + CTA).
- Scenes 2-4 each pick the template that best fits their content:
  - "flowchart": a process or sequence — provide 3-5 short "steps".
  - "stat": one striking number — provide a "stat" object. "value" is a plain number; use "prefix" (e.g. "R", "$") or "suffix" (e.g. "%", "x", "+") as needed.
  - "iconGrid": 3-4 parallel ideas, benefits, or categories — provide "items" with one emoji each.
  - "diagram": a central concept with related parts — provide "diagram" with a "centerLabel" and 3-5 "nodes".
- Only include the data field that matches the chosen template. Omit the others.
- headline is short and punchy. body explains it in everyday language. Never repeat the headline in the body.
- Make every scene visual and concrete. Use real, accurate facts from your research.
- Output JSON only.`;
}
