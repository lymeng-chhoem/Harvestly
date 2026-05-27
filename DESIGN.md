---
name: "Harvestly"
description: "Khmer-first crop diagnosis for Cambodian farmers in the field."
colors:
  field-green: "oklch(18% 0.04 145)"
  paddy-surface: "oklch(22% 0.045 145)"
  raised-leaf: "oklch(27% 0.05 143)"
  parchment: "oklch(89% 0.055 86)"
  parchment-deep: "oklch(82% 0.07 84)"
  antique-gold: "oklch(78% 0.12 84)"
  action-gold: "oklch(68% 0.12 82)"
  action-gold-deep: "oklch(52% 0.085 90)"
  text-on-dark: "oklch(91% 0.035 86)"
  text-muted: "oklch(70% 0.045 95)"
  danger: "oklch(61% 0.16 35)"
  warning: "oklch(76% 0.13 77)"
typography:
  display:
    fontFamily: "Kantumruy Pro, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Kantumruy Pro, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Kantumruy Pro, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.35
  body-khmer:
    fontFamily: "Kantumruy Pro, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  body-latin:
    fontFamily: "Poppins, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  control: "14px"
  panel: "22px"
  pill: "999px"
spacing:
  touch-min: "48px"
  control-pad: "14px 20px"
  panel-pad: "24px"
  section-gap: "22px"
components:
  button-primary:
    backgroundColor: "{colors.action-gold}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.control-pad}"
    height: "{spacing.touch-min}"
  button-primary-active:
    backgroundColor: "{colors.action-gold-deep}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.control-pad}"
    height: "{spacing.touch-min}"
  upload-panel:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.field-green}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  navigation-selected:
    backgroundColor: "{colors.action-gold-deep}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "{spacing.control-pad}"
    height: "{spacing.touch-min}"
---

# Design System: Harvestly

## Overview

**Creative North Star: "The Field Guide at Dusk"**

Harvestly is a working field instrument, not a marketing dashboard. Its atmosphere borrows from a worn crop-disease manual held beside a Cambodian paddy: deep rice-field green around the edges, parchment where a farmer must act, antique gold botanical engraving, documentary imagery used as evidence, and quiet Angkor-derived linework used only to establish place and trust.

The design must stay legible during an urgent outdoor task. A farmer should immediately find the camera or gallery action, understand that analysis is underway, and read risk and treatment without navigating a dense interface. Heritage detail lives in framing, branding, and empty space; it never competes with diagnosis.

**Key Characteristics:**
- Khmer-first content with a deliberate, secondary English toggle.
- A dominant upload and analysis task with large controls and immediate results.
- Deep paddy-green surfaces and parchment task areas, with antique gold reserved for action, wayfinding, and botanical identity.
- Documentary crops and restrained engraved motifs, never decorative clutter.
- Structural mobile behavior for basic Android devices and one-hand use.

## Colors

The palette is rice-field green and parchment-warm, with antique gold signaling action, identity, and agricultural familiarity. The YAML token values above are the source of truth. Red and amber remain semantic risk colors and do not become general decoration.

### Primary
- **Action Gold:** Primary camera, upload, analyze, retry, and selected-navigation emphasis.
- **Deep Action Gold:** Pressed or selected emphasis where the primary action must feel tactile and committed.

### Secondary
- **Antique Gold:** Headings, rice linework, guidance accents, and small identity details that signal warmth without competing with action.
- **Parchment:** The scan/upload working surface and instructional regions where legibility in sunlight matters most.

### Neutral
- **Field Green:** Page ground and high-contrast shell.
- **Paddy Surface:** Sidebar and secondary navigation ground.
- **Raised Leaf:** Result panels and dark content surfaces.
- **Text on Dark:** Primary readable text on dark surfaces.
- **Text Muted:** Secondary supporting text only; never essential actions or diagnosis.

### Named Rules

**The Work Surface Rule.** The upload and immediate result workflow earns the light parchment surface; secondary modules remain dark and quieter.

**The Gold Signal Rule.** Antique gold is restricted to actions, selected navigation, rice identity detail, and clear wayfinding. Red and amber communicate risk only.

## Typography

**Display Font:** Kantumruy Pro (with sans-serif fallback)  
**Body Font:** Kantumruy Pro for Khmer; Poppins for opted-in English (with sans-serif fallback)  
**Label Font:** Poppins for Latin controls; Kantumruy Pro for Khmer controls

**Character:** Khmer copy must feel native, sturdy, and calm under pressure. English is a support mode, not a second visual voice competing on every screen.

### Hierarchy
- **Display** (700, 44px, 1.15): Rare hero or diagnosis framing text; avoid oversized display copy on small devices.
- **Headline** (600, 28px, 1.25): Upload, result, and primary workflow section labels.
- **Title** (600, 20px, 1.35): Disease names, steps, and navigation destinations.
- **Body** (400, 18px Khmer / 16px Latin, 1.65 / 1.55): Guidance and treatment; prose must remain concise and no wider than 70ch.
- **Label** (600, 15px, 1.25): Buttons, status pills, and explicit toggles.

### Named Rules

**The One Language Rule.** Default farmer workflows show Khmer only. English appears only after the user explicitly selects it; never stack bilingual labels across ordinary task screens.

## Elevation

The system uses tonal layering first: parchment over deep paddy green, raised leaf-green surfaces over field green, and full one-pixel borders for containment. Shadows are restrained and ambient, used only to separate primary working surfaces or communicate interaction.

### Shadow Vocabulary
- **Working Surface:** A soft, broad shadow beneath the scan area to make the primary task physically distinct.
- **Active Control:** A modest lift on touch or focus feedback, paired with a gold color change rather than theatrical motion.

### Named Rules

**The Relief Rule.** Angkor-inspired relief appears as low-contrast linework or texture in supporting space only; never beneath text, buttons, or diagnostic values.

## Components

### Buttons
- **Shape:** Broad, easy-to-hit controls with rounded corners (14px) and a minimum touch height (48px).
- **Primary:** Action Gold background with Text on Dark, reserved for camera/gallery selection, analysis, retry, and treatment continuation.
- **Hover / Focus:** Shift toward Deep Action Gold and add a visible focus outline; feedback must remain obvious in outdoor light.
- **Disabled / Loading:** Preserve size and placement; lower contrast only after providing a clear label such as analyzing or unavailable.

### Cards / Containers
- **Corner Style:** Soft working panels (22px) with full subtle borders.
- **Background:** Parchment for scan and immediate guidance; Raised Leaf for supporting history and reference material.
- **Shadow Strategy:** Ambient elevation only for the primary working surface; ordinary containers rely on tonal contrast.
- **Internal Padding:** Spacious around actions (24px), denser only in history lists after the diagnosis task.

### Inputs / Fields
- **Style:** The upload region is a full, tappable file-selection control with visible camera/gallery language, not drag-and-drop alone.
- **Focus:** Strong antique-gold outline or border shift that is visible against parchment.
- **Error / Disabled:** Error copy appears directly below the upload region in plain Khmer; disabled analysis states explain what is needed next.

### Navigation
- **Style:** A steady paddy-green rail on larger screens, with Khmer-only labels by default and one selected item in restrained antique gold.
- **Mobile Treatment:** Replace the rail with a compact, thumb-reachable navigation treatment that does not reduce the upload control or result text.
- **Language Control:** An explicit Khmer/English switch in navigation utility space; Khmer is selected on first use.

### Scan And Diagnosis Workflow
- **Empty State:** A large camera/gallery target, one instruction, and supported file constraints.
- **Preview State:** Show the selected crop photo and a single obvious analyze action.
- **Analyzing State:** Keep the preview visible, mark progress clearly, and prevent duplicate actions.
- **Result State:** Put diagnosis name, risk, confidence, and treatment ahead of history and education content.
- **Failure State:** State the problem in direct Khmer and provide a retry or photo-selection action.

### Data Guidance And Motion
- **Readiness Meters:** Percentages near the upload task describe illustrative photo preparation conditions, never diagnosis quality.
- **Disease Reference Meters:** Any risk percentages are visibly labeled as demonstration reference content until a real model exists.
- **Motion:** Use a short branded loading veil on initial shell entry, reversible viewport reveals as the user scrolls through homepage sections, and touch feedback using opacity and transforms; disable all movement under reduced-motion preferences.

## Do's and Don'ts

### Do:
- **Do** make camera or gallery selection the clearest action on first load, with touch targets at least 48px tall.
- **Do** default all farmer-facing workflow text to Khmer and keep English behind an explicit toggle.
- **Do** reserve parchment contrast for the scan and immediate treatment task, especially for outdoor readability.
- **Do** use Cambodian vintage poster and Angkor relief cues as restrained framing, never as competing content.
- **Do** show diagnosis, confidence, risk, and treatment in a single understandable result path.

### Don't:
- **Don't** produce Grab or AirAsia app styling; urban corporate polish feels detached from this field context.
- **Don't** imitate Duolingo-like gamification; crop loss is urgent, not a streak or reward loop.
- **Don't** create a Silicon Valley agri-tech startup UI with bright white sterile surfaces and foreign-feeling dashboards.
- **Don't** build a ChatGPT or Claude-style interface; dense conversational text is the wrong primary affordance.
- **Don't** mix Khmer and English across default screen labels or bury primary actions beneath decorative modules.
- **Don't** use decorative motion, glass effects, ornate surfaces under critical copy, or visual flourishes that compete with scanning.
