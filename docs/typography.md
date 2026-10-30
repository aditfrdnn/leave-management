# Typography

One size and one weight per role, so the hierarchy reads the same on every page.
The type roles live in `src/styles/typography.css`; the body is 14px (`text-sm`) by default.

## Roles

| Role | Class | Size | Weight | Use for |
| --- | --- | --- | --- | --- |
| Display | `type-display` | 30px, 36px from `sm` | 600 | The hero headline on the main dashboard. Nowhere else. |
| Page title | `type-page-title` | 20px | 600 | The one `h1` at the top of a page. |
| Heading | `type-heading` | 18px | 600 | Section headings outside cards. `DialogTitle` and `SheetTitle` use it already. |
| Card title | `CardTitle` (`type-section-title` outside cards) | 16px | 600 | Card and panel titles. |
| Stat | `type-stat` | 30px | 600, tabular | Headline numbers on stat cards and donut totals. |
| Metric | `type-metric` | 24px | 600, tabular | Secondary numbers or short values inside a card. |
| Body | none (inherits `text-sm`) | 14px | 400 | Paragraphs, descriptions, table cells. |
| Label | `text-sm font-medium` | 14px | 500 | Navigation, buttons, table headers, form labels, stat card labels. |
| Caption | `text-xs` | 12px | 400 (500 for badges) | Hints, metadata, deltas under a stat, badges. |
| Overline | `type-overline` | 11px | 500, uppercase | Small uppercase group labels such as "OR". |
| Micro | `text-2xs` | 11px | 400–500 | Dense chips, avatar initials, chart ticks. |

Descriptions under a title stay body or caption size in `text-muted-foreground`. They are never bigger than the title above them.

## Weights

- **400 (`font-normal`)**: running text.
- **500 (`font-medium`)**: interactive and structural UI such as nav items, buttons, table headers and labels, and emphasis inside a sentence.
- **600 (`font-semibold`)**: titles, numbers and the active item.
- **700 (`font-bold`) is not used.** At Inter's 2px icon weight it reads heavier than everything around it. ESLint rejects it.

## Rules

- Size steps come from Tailwind's scale (`text-2xs` to `text-4xl`). Arbitrary sizes like `text-[13px]` are rejected by ESLint; pick the nearest role.
- Pages use the `type-*` roles. UI primitives (`components/ui`) use plain utilities so `className` overrides still merge.
- A page has one `type-page-title`. Inside it, the hierarchy steps down: page title, then heading, then card title, then body.
