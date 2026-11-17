# Functional icon colors and angular hero

Date: 2026-11-13

## Proposals

[Comparison page](../../icon-directions.html) uses the same four fictional jobs, in the same order, for A and B. All four experience levels and all three work areas are represented.

- **A — experience:** Junior sage, Mid blue-grey, Senior soft violet, Lead sand. A text tag retains the explicit level. Useful for comparing career fit, but the employer initials can change color between roles and four colors require learning.
- **B — work area:** Build soft violet, Apply sage, Lead blue-grey. The company line retains the explicit area. This reinforces the platform's three-way structure, but the colored employer tile may still be interpreted as company branding.
- **C — recommended placement of B:** neutral employer identity plus a small area-colored symbol. Build uses connected modules; Apply uses a star; Lead uses a coordination network. Text labels remain visible, and experience stays a separate tag. This also accommodates real logos without recoloring them.

Recommendation is a design judgment based on DoRoboty.ai's navigation structure, not user research. The broad list benefits from orientation by area; within a filtered area, experience may be more useful for comparing individual roles. No proposal has been chosen as the default: the default page remains neutral. `iconScheme=experience`, `iconScheme=category`, and `iconScheme=marker` enable reviewable full-list previews; filtering and reload preserve the selected preview.

Color supplements text and, for C, a distinct symbol. Source: [W3C Understanding SC 1.4.1, Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), accessed 2026-11-13. The source supports redundant visual information; it does not establish which product attribute should receive color.

## Angular hero edit

Tool: built-in imagegen, edit mode, `transparent_background: true`.

Input: [Transparent collage](../../assets/human-technology-hero-cutout.png).

Saved output: [Angular transparent collage](../../assets/human-technology-hero-angular.png), RGBA, 1536×1024. Original versions are retained. The new asset is used in the main listing and comparison page.

Prompt:

> Use case: precise-object-edit. Edit this exact transparent editorial collage for the DoRoboty.ai website hero. Change ONLY the outer contours of the collage panels: replace the scalloped, wavy torn-paper edges with clean geometric cut-paper edges. The royal violet panel must have a few long straight edges, crisp corners, restrained 45-degree chamfers and 90-degree steps. Architectural fragments and the bottom crop through clothing should end in deliberate straight diagonals or geometric polygon edges, not an undulating wavy contour. Think precision-cut editorial collage with calm broad angular shapes, NOT a serrated zigzag or torn paper. Preserve the exact same person's identity, expression, pose, face, hair and halftone texture. Keep the hair's natural silhouette, do not polygonize the person's face. Preserve #7B2CBF violet, #C2F970 lime circuits, all three circular diagram inserts (keep them round), and existing architecture layout. Remove any colored haze outside the solid foreground. Genuine alpha-transparent background and negative space, no beige rectangle, no backdrop, no fog, no glow, no shadows. Retain landscape 3:2 framing with a slight transparent margin around the collage. No words or logos. Make the difference between old wavy edges and new crisp long straight polygon edges clearly visible without redesigning the illustration.
