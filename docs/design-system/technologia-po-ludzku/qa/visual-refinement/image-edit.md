# Hero background integration

Date: 2026-11-13

Tool: built-in `imagegen`, edit mode, `transparent_background: true`.

Input: [Original illustration](../../assets/human-technology-hero.png).

Selected output: [Transparent hero collage](../../assets/human-technology-hero-cutout.png), RGBA, 1536×1024. The original is retained. The page uses this copy in its normal local asset pipeline, with a transparent wrapper and a CSS alpha mask that blends the bottom edge into the page. The face, circuit diagrams and violet field remain visible.

Prompt for the selected output:

> Use case: background-extraction. Edit target: the provided editorial collage for the DoRoboty.ai website hero. Remove ALL warm cream paper background, crop/registration marks, and the rectangular beige mat, replacing those areas with genuine alpha transparency. Preserve the same fictional person, face, pose, expression, graphite/cream halftone clothing, purple #7B2CBF geometric field behind the person, lime #C2F970 circuit traces/nodes/circles and existing architecture fragments as a cohesive cut-paper collage. Retain the reference style, original colors and arrangement; do not reimagine the person. Keep the cream halftone highlights INSIDE the person and architecture, remove only the surrounding paper ground. Give the entire collage a distinct irregular cut-paper outer silhouette, with a small transparent margin around it so there is no rectangular photo border, no rectangular crop through the head, and no opaque backdrop. Extend tiny clipped edges only as needed for a clean outer silhouette. Intended to sit directly on flat warm paper website background #F7F5ED, not a poster or framed image. Landscape 3:2 composition. No text, logos, shadow, added glow or new objects. Output transparent PNG, genuine alpha channel.

Other refinements in the same change: the native selects in “Więcej filtrów” retain their semantics but use a custom decorative SVG chevron inset 14px from the right, with 42px text padding. Forced-colors mode restores the platform chevron. All fallback employer initials use the same neutral background; their previous alternating colors had no semantic meaning and changed with row order.
