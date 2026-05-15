---
name: carousel-creator
description: >
  Generate branded Instagram carousel slides — from topic to export-ready PNG images.
  Use this skill whenever the user says "create a carousel", "make carousel slides", "carousel for [topic]",
  "Instagram carousel", "carousel about [topic]", "make me slides", "create slides for Instagram",
  or anything involving building branded social media carousels. Also trigger when the user wants to
  turn a blog post, transcript, or idea into carousel slides. Handles the full pipeline: copywriting
  carousel slides, building HTML, and exporting to PNG images. On first run, walks the user through
  a setup wizard to configure their brand (colors, fonts, name, handle). Supports custom HTML templates
  and optional Google Drive upload.
---

# Carousel Creator

Generate branded Instagram carousels — from topic idea to export-ready PNG images.

## How It Works

1. **First run**: A setup wizard asks for brand colors, fonts, name, and handle — saved to `brand-config.json`
2. **Give it a topic**: Provide a topic, angle, transcript, or pre-written slide content
3. **Review copy**: Claude writes carousel slides in your brand voice, you approve or tweak
4. **Auto-export**: Builds HTML slides, exports each as a 1080×1350 PNG (4:5 aspect ratio)
5. **Optional upload**: Push PNGs to Google Drive for easy scheduling

## Quick Start

```
create a carousel about why AI won't replace you
carousel slides for: "5 things I wish I knew before starting my business"
carousel about meal prep for busy parents
```

## Setup Wizard (First Run Only)

On first use — or if no `brand-config.json` exists in the working directory — run the setup wizard.

Ask the user these questions one at a time in a conversational way. Don't dump all questions at once.

### Questions to ask:

1. **What's your name or brand name?** (e.g., "Jane Smith" or "The Content Lab")
2. **What's your social handle?** (e.g., "@thecontentlab")
3. **What are your brand colors?** Ask for:
   - Primary color (used for cover slides, CTAs, strong emphasis)
   - Secondary/accent color (highlights, buttons, attention-grabbers)
   - Background color (main slide background — often a warm white or light neutral)
   - Text color (primary text — often dark charcoal, never pure black)
   If they're unsure, offer to use a clean default palette and they can tweak later.
4. **What Google Font do you use for headlines?** (e.g., "Montserrat", "Poppins", "Playfair Display"). If unsure, default to Montserrat.
5. **What Google Font do you use for body text?** (e.g., "DM Sans", "Work Sans", "Open Sans"). If unsure, default to DM Sans.
6. **Do you have a hashtag or tagline you use?** (e.g., "#AIWithoutTheIck", "#MealPrepMonday"). Optional.
7. **Share some carousel styles you love.** Ask them to drop 2-3 Instagram carousel examples they like the look of — screenshots, URLs, or just describe what they're drawn to. Prompt with examples like:
   - "Do you like bold text-heavy slides, or more minimal with lots of white space?"
   - "Any accounts whose carousels you think look amazing?"
   - "Do you prefer clean and professional, playful and colourful, moody and editorial, or something else?"
   - "Do you like rounded corners or sharp edges? Thin borders or none? Icons or no icons?"
   
   This is important — it means everyone's carousel template looks different. Don't let them skip this. If they're struggling, ask them to pick from these vibe options: **Clean & Minimal** | **Bold & Punchy** | **Soft & Editorial** | **Playful & Colourful** | **Dark & Moody**

8. **Describe your brand voice in a sentence or two.** (e.g., "Casual and direct, a bit cheeky, Australian English" or "Professional but warm, no jargon"). This helps Claude write slide copy that sounds like them.
9. **Any words or phrases you NEVER want used?** (e.g., "game-changer, unlock, level up, slay"). Optional but recommended.

### Generate their custom template:

After collecting style inspiration in step 7, **build a custom HTML carousel template** tailored to their preferences. Do NOT use the bundled `carousel-template.html` as the final template — it's a structural reference only, showing the technical contract (CSS custom properties, slide classes, export setup).

Based on their style answers, generate a unique template that reflects their aesthetic. Consider varying:
- **Layout**: centered vs left-aligned text, padding amounts, text positioning
- **Typography treatment**: all caps headlines vs sentence case, font weight, letter spacing, size ratios
- **Visual elements**: border accents, divider lines, rounded vs sharp corners, background shapes or geometric accents
- **Slide personality**: how cover vs content vs CTA slides differ visually
- **Decorative touches**: subtle patterns, corner flourishes, badge styles, emphasis treatments (underlines, highlights, boxes)
- **Spacing & density**: airy and spacious vs compact and punchy

The generated template must keep the same technical contract:
- CSS custom properties: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--font-headline`, `--font-body`
- `.slide` class on each slide, `.slide-cover`, `.slide-light`, `.slide-dark`, `.slide-cta` variants
- `#slideFrame` as the export container (420×525px)
- html2canvas script included
- Google Fonts loaded dynamically

But the visual design should be meaningfully unique to this user.

Save the generated template as `templates/my-carousel-template.html` in their working directory. This becomes THEIR template — used for all future carousels.

If they later say "I want to change my template style" or "make my carousels look more [x]", regenerate the template based on new input.

### Save the config:

Write `brand-config.json` to the user's working directory:

```json
{
  "brand_name": "The Content Lab",
  "handle": "@thecontentlab",
  "colors": {
    "primary": "#396a6b",
    "secondary": "#f17a51",
    "accent": "#97d3b4",
    "background": "#faf9f7",
    "text": "#2d2d2d"
  },
  "fonts": {
    "headline": "Montserrat",
    "body": "DM Sans"
  },
  "hashtag": "#ContentLabTips",
  "style_inspiration": {
    "vibe": "Clean & Minimal",
    "notes": "I love @chrisdo's carousels — bold text, lots of white space, no clutter. Sharp corners, thin accent lines. I like left-aligned text with one strong headline per slide.",
    "references": ["@chrisdo", "@jasonfalls"]
  },
  "voice": {
    "description": "Casual and direct, slightly cheeky, Australian English",
    "banned_phrases": ["game-changer", "unlock", "level up", "slay"]
  }
}
```

On subsequent runs, read `brand-config.json` from the working directory and skip the wizard. If the user says "update my brand config" or "change my colors", re-run the relevant questions and update the file.

## Input Modes

### Mode 1: Topic (generates slide copy)
The user provides a topic, angle, or pastes transcript text. Claude writes carousel slides.

**Example**: `create a carousel about imposter syndrome as a founder`

### Mode 2: Raw slides (skip copy generation)
The user provides pre-written slide content. Claude skips straight to HTML building.

**Example**: `carousel with these slides: "Cover: You don't need more tools" "2: You need better systems" "3: Here's what I mean" "CTA: Follow for more"`

Detect Mode 2 when the user provides explicit slide-by-slide content with clear numbering, "Cover:", or multiple quoted strings that map to individual slides.

## Stage 1: Write Slide Copy (Mode 1 only)

Read `brand-config.json` to get voice guidelines and banned phrases.

### Slide structure rules:

**Slide 1 (Cover):** 5-8 words MAXIMUM. Count before outputting.
- Curiosity gap, relatable question, or bold claim
- Rendered in uppercase on the final slide
- This is the scroll-stopper — make it earn attention

**Slides 2-6 (Content):** 5-20 words each.
- One idea per slide
- Build an arc: problem → insight → solution, or curiosity → reveal → action
- Alternate between dark-background and light-background slides for visual rhythm
- Use the user's brand voice from config

**Final slide (CTA):** Greeting + name + handle + call-to-action button
- Default button text: "Follow for more"
- Can be customised with `--cta` flag or user instruction

**Total: 5-9 slides. Never exceed 9.**

### Voice guidelines:
- Use the `voice.description` from brand-config.json to match tone
- Never use any phrase from `voice.banned_phrases`
- Keep language punchy and scannable — these are slides, not blog posts
- Write in the user's preferred English variant if specified

**Present the slide copy to the user and wait for approval before building HTML.** Don't proceed until they confirm or request changes.

## Stage 2: Build HTML

Read the user's custom carousel template from `templates/my-carousel-template.html` (generated during setup). If it doesn't exist yet, fall back to `templates/carousel-template.html` and prompt the user to run the style setup ("Looks like you don't have a custom template yet — want to set one up? Just describe some carousels you like the look of and I'll build one for you.").

### How the template works:

The template is a single HTML file containing:
- All slide layouts (cover, content-light, content-dark, CTA)
- html2canvas library for PNG export
- CSS custom properties for brand colors and fonts
- JavaScript to handle slide switching and export

### Populate the template:

1. Copy `templates/carousel-template.html` to the working directory as `.tmp/carousel-[slug].html`
2. Replace the CSS custom property values with the user's brand config:
   ```css
   --color-primary: [colors.primary];
   --color-secondary: [colors.secondary];
   --color-accent: [colors.accent];
   --color-bg: [colors.background];
   --color-text: [colors.text];
   --font-headline: '[fonts.headline]', sans-serif;
   --font-body: '[fonts.body]', sans-serif;
   ```
3. Build the slide HTML:
   - **Cover slide**: `slide-cover` class — primary color background, light text, headline font uppercase, hashtag top-left in accent color, "by [brand_name]" bottom-left, swipe arrow bottom-right
   - **Content slides**: Alternate between `slide-light` (background color bg, text color text) and `slide-dark` (primary color bg, light text). Each has heading + body text + secondary color emphasis line. Badge top-right showing position ("3/8"), handle bottom-left
   - **CTA slide**: `slide-cta` class — primary color bg, greeting text, brand name, handle, CTA button in secondary color

4. Update the JavaScript `totalSlides` variable to match actual slide count
5. Save the file

### Font loading:
The template loads Google Fonts dynamically. The font names from brand-config.json are injected into a Google Fonts `<link>` tag in the HTML head. The template handles this — just make sure the font names are valid Google Fonts names.

## Stage 3: Export to PNG

This is fully automated. Never ask the user to export manually.

### Export pipeline:

1. **Start a local HTTP server:**
   ```bash
   cd [working-directory] && python3 -m http.server 8765 --directory .tmp &
   ```

2. **Navigate browser to the HTML file:**
   Open `http://localhost:8765/carousel-[slug].html`

3. **Wait for fonts + html2canvas to load** (2000ms minimum)

4. **For each slide**, run via browser JavaScript execution:
   ```javascript
   // Activate this slide
   document.querySelectorAll('.slide').forEach(s => {
     s.classList.remove('active');
     s.style.display = 'none';
   });
   const slide = document.querySelectorAll('.slide')[INDEX];
   slide.classList.add('active');
   slide.style.display = 'flex';
   ```
   Wait 300ms for render, then:
   ```javascript
   const frame = document.getElementById('slideFrame');
   const canvas = await html2canvas(frame, {
     scale: 3,
     useCORS: true,
     backgroundColor: null
   });
   return canvas.toDataURL('image/png');
   ```

5. **Decode and save** each base64 PNG to `.tmp/carousel-exports/[slug]-slide-[N].png`

6. **Verify**: Read 2-3 exported PNGs to confirm they rendered correctly (colors, text, no broken elements)

7. **Kill the HTTP server** when done

### Export dimensions:
html2canvas at scale:3 with a 420×525 slide frame = **1260×1575px** PNGs (4:5 aspect ratio, Instagram-optimized).

## Stage 4: Upload to Google Drive (Optional)

Only run this stage if the user explicitly asks to upload to Drive, or if they've configured it.

This requires MCP Google Workspace tools. If unavailable, skip and just provide the local file paths.

1. Upload each PNG:
   - Use `create_drive_file` with the PNG file path
   - Name format: `carousel-[slug]-slide-[N].png`

2. Set permissions for link sharing (reader access)

3. Build download URLs:
   ```
   https://drive.google.com/uc?export=download&id=[FILE_ID]
   ```

4. Return the URLs to the user

## Stage 5: Return Results

Output a clean summary:

```
CAROUSEL READY: [Topic]

Slides: [count]
Exported: [count] PNGs
Location: .tmp/carousel-exports/

[If Drive uploaded:]
Drive URLs:
- Slide 1: [url]
- Slide 2: [url]
...
```

If Google Drive URLs are available, also output them as a JSON array so they can be passed to scheduling tools:
```json
["url1", "url2", "url3"]
```

## Flags & Options

Users can include these in their request:

| Flag | Default | What it does |
|------|---------|-------------|
| `--cta "text"` | "Follow for more" | Custom CTA button text on the final slide |
| `--count N` | 1 | Number of different carousels to generate on the same topic (different angles) |
| `--upload` | off | Upload exported PNGs to Google Drive |
| `--slides N` | auto (5-9) | Target number of slides |

## Updating Brand Config

If the user says any of these, update `brand-config.json`:
- "change my colors to..."
- "update my brand config"
- "my handle changed to..."
- "use [font] for headlines now"
- "add [phrase] to my banned words"

Read the current config, make the requested change, save, and confirm.

## Important Rules

1. **Never use AI-generated images.** Carousels are text-based slides with brand colors. No stock photos, no AI art.
2. **Hashtags go in captions, not on slides** — except for a small topic hashtag on the cover slide.
3. **Brand colors are non-negotiable.** Always use the colors from brand-config.json. Never default to generic blue/white.
4. **Instagram-safe text**: No `#` symbols in body text of slides. Hashtags go in the caption the user writes when posting.
5. **Export dimensions**: Always 4:5 aspect ratio for Instagram feed.
6. **Approval gate**: Always show slide copy and wait for user approval before building HTML. The user's voice matters more than efficiency.
7. **Working directory**: Create a `.tmp` folder in the user's current working directory for HTML files and exports. Don't scatter files everywhere.

## Template Customisation

The bundled `templates/carousel-template.html` is a starting point. Users can:
- Replace it with their own HTML template (just keep the same CSS variable names and slide class structure)
- Add additional templates (e.g., `carousel-photo-template.html`) and reference them with `--template photo`
- Modify the template's CSS for different slide layouts

If the user provides their own template, read it and adapt the HTML-building logic to match their structure. The key contract is: CSS custom properties for colors/fonts, `.slide` class for each slide, `#slideFrame` as the export container.

## Cleanup

After successful export:
- Keep `.tmp/carousel-exports/` PNGs for the user to access
- Keep `.tmp/*.html` files for re-export if needed
- Kill any running HTTP server on port 8765
