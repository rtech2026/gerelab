# 🎨 Elite SaaS UI/UX Engineering & Design Master Rules

## 1. Core Philosophy: World-Class SaaS Aesthetic
- **Visual Standard:** Match the level of polish, minimalism, and craftsmanship found in top-tier products like **Linear, Vercel, Supabase, Stripe, and Raycast**.
- **Dark Mode Excellence:** Sleek obsidian/zinc tones (`#09090b`, `#0d0e15`, `#12131c`), deep contrast, subtle 1px translucent borders (`border-white/5` or `border-border/40`), and vibrant emerald/brand accents.
- **Minimalism & Cleanliness:** Avoid visual noise, massive empty boxes, clunky generic buttons, or misaligned containers. Every element must feel intentional, balanced, and premium.

## 2. Image References (Highest Priority)
- **Mandatory Reference Following:** Whenever the user uploads or provides an image, mockup, screenshot, or design reference, analyze it thoroughly and replicate its layout, color harmony, typography scale, spacing, and component hierarchy with pixel-level precision.
- Never override or ignore the user's reference with generic layouts.

## 3. Design System & Codebase Harmony
- **Respect Existing Design Tokens:** Always inspect and reuse the application's existing components (`@/components/ui/*`, Shadcn UI, Tailwind tokens, CSS variables).
- **Consistent Page Structure:** Maintain header/sidebar consistency, standard container widths (`max-w-6xl` or `max-w-7xl`), and coherent margin/padding rhythm (`p-6`, `gap-4`, `gap-6`).
- **Typography:** Refined font hierarchies with clear weights (`font-medium`, `font-semibold`, `font-bold`), crisp monospace numbers (`font-mono`), and readable subtitles in `text-muted-foreground` (`text-zinc-400`).

## 4. Component Craftsmanship
- **Cards & Surfaces:** Multi-layered depth using subtle glassmorphism (`backdrop-blur-md`), dark card backgrounds (`bg-card` or `bg-white/[0.02]`), and fine borders.
- **Data Tables & Lists:** Clean rows, gentle hover highlights (`hover:bg-white/[0.02]`), compact status badges with subtle background tints and colored text, clear action buttons.
- **Scrollbars & Overflow:** Ultra-minimalist custom scrollbars (`width: 4px` to `6px`), zero ugly native browser scrollbars, zero horizontal overflow bugs.
- **Interactive Feedback:** Smooth transitions (`transition-all duration-200`), clear loading states (subtle spinners/skeletons), and informative toast notifications.
