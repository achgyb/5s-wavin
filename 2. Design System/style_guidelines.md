## Brand & Style

This design system is built for the high-pressure, physical environment of the factory floor. The aesthetic is **Industrial and Rugged**, prioritizing extreme legibility, high-contrast visibility, and functional reliability over decorative softness. It draws inspiration from heavy machinery instrumentation and safety signage, utilizing a "Utility-First" philosophy. 

The brand personality is authoritative, resilient, and precise. It is designed to be operated in environments with varying light conditions and by users who may be wearing personal protective equipment (PPE). The visual language moves away from typical consumer SaaS patterns, favoring a raw, brutalist-inspired structure that emphasizes durability and clear hierarchies.

## Layout & Spacing

This design system employs a **Fluid Grid** model designed for "glove-friendly" interaction. The spacing rhythm is generous to prevent accidental taps in mobile contexts.

- **Interaction Safety:** A strict 48x48px minimum touch target is enforced for all interactive elements (buttons, checkboxes, toggles).
- **Mobile Layout:** Employs a fixed bottom navigation bar for thumb-driven access. Content is stacked vertically in a single column with 16px margins.
- **Desktop Layout:** Utilizes a persistent left sidebar for navigation. Content uses a 12-column grid with 24px gutters to organize complex audit forms and data visualizations.
- **Density:** While the visual style is "heavy," spacing between sections remains open (24px+) to prevent the UI from feeling cluttered or overwhelming during intense audit tasks.

## Elevation & Depth

To maintain the rugged, industrial aesthetic, this design system avoids soft, ambient shadows. Depth is communicated through **Tonal Layering** and **High-Contrast Outlines**.

- **Surface Levels:** 
  - Level 0: Background base (#0D0F12).
  - Level 1: Surface panels and cards (#1A1D21).
  - Level 2: Overlays and modals, defined by a 2px safety-yellow or border-gray outline.
- **Active States:** Depth is suggested through color shifts (e.g., a button "pressing" into the surface by darkening) rather than lifting off the surface.
- **Dividers:** Rigid 1px lines (#2C3036) are used to separate logical groups of information, reinforcing the grid-based structure.

## Components

### Buttons
- **Primary:** Solid Safety Yellow background with black text. Sharp 4px corners. 
- **Secondary:** Outline style with 2px Safety Yellow border and Safety Yellow text.
- **Sizing:** Minimum height 48px.

### Status Badges
- **Format:** High-contrast capsules with bold, uppercase text.
- **Pass:** Safety Green background, white text.
- **Fail:** Safety Red background, white text.
- **Pending:** Safety Orange background, black text.
- **N/A:** Border-gray background, secondary text.

### Input Fields
- Dark Charcoal background with a 2px bottom border or full outline in border-gray.
- Focus state triggers a Safety Yellow border.
- Error states trigger a Safety Red border and inline text.

### Cards
- Used to group audit questions or equipment data.
- No shadows. Defined by a 1px border (#2C3036).
- Headers within cards should use the `label-md` or `headline-md` style for clear sectioning.

### Checkboxes & Radios
- Oversized (24x24px within the 48px touch target).
- Heavy 2px borders.
- Safety Yellow fill when selected for maximum visibility.