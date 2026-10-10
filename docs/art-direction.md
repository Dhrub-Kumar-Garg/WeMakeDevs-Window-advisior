# Art Direction: Window-Open Advisor

## Composition & Intent

The primary aesthetic transitions from a generic dashboard format into an **architectural section drawing**. It will feel like an interactive blueprint or technical document authored by an engineer-designer. The canvas is a continuous scrolling sheet ("paper"), heavily utilizing solid "ink" lines, restrained "ink" typography, and semantic, purposeful color. 

The dominant element of the first viewport is the **VERDICT WORD** ("OPEN WINDOW" or "KEEP WINDOW CLOSED"). It must be massive, taking up significant visual weight, acting as the definitive conclusion of the underlying data. 

Directly paired with this is the **Section Drawing**. Rather than treating the room visualization as a decorative floating 3D widget, the drawing cuts across the entire left 2/3 of the screen. The viewer immediately sees the physical reality: the outdoors, the solid boundary wall, the window cutout, and the interior volume.

## Justification

1. **Cognitive Clarity:** The product's core job is answering "Should this room breathe right now?" The user should not have to parse 6 different charts to figure this out. The massive verdict word delivers the answer instantly, while the section drawing provides the intuitive "why" (showing stale air density vs. outdoor air density).
2. **Portfolio Consistency:** By using `Space Grotesk`, `Space Mono`, and `Instrument Serif`, along with the `#f8f9fc` paper background and `#ff5f1f` / `#00d4aa` semantic colors from my portfolio, the product instantly inherits my signature visual identity. It will look like a bespoke product designed by me, not a Vercel/Tailwind SaaS template.
3. **Scientific Honesty:** Using a single, coherent 2D section drawing with stippling prevents the interface from over-promising. 3D fluid simulations imply precise fluid dynamics, which we don't have. Stippling accurately conveys the *metaphor* of density and concentration derived from our mathematical physics estimate.

## The Signature Interaction: The Sash

The window opening is not a toggle switch; it is a draggable **Sash**. Dragging the sash directly manipulates the ACH (Air Changes per Hour) variable in a ghost simulation running forward in time. As the user drags, they immediately see the *future consequence* of their action visualized as a ghost trace on the CO₂ evidence chart and a color change in the inflowing air stipple. If the air outside is harmful, the incoming air turns the signal color (`#ff5f1f`). The design explicitly connects physical action to environmental consequence.
