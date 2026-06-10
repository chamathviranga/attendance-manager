# Attendance Mark UI Style Definition

This document outlines the design system, color tokens, typography, and component specifications used in the Attendance Mark web application. Use this definition as a blueprint for implementing the same style in new projects.

---

## 1. Design Philosophy

The design philosophy is **Minimalist Cyber-Industrialism**. Key goals include:
*   **High Contrast & Dark-First**: True dark background Canvas with deep gray containers and striking neon accents.
*   **Architectural Grid System**: Box borders are sharp (`rounded-none` or `rounded-sm`), using thin border lines (`#2C2C2C`) instead of heavy shadows to establish structure.
*   **Expressive Typography**: Strict use of uppercase tracking (letter-spacing) on labels to create a clean, premium dashboard layout.
*   **Fluid Micro-Animations**: Smooth color and border transitions to make the application feel reactive and alive.

---

## 2. Color Palette

All colors are tailored for modern OLED displays to prevent eye fatigue while highlighting critical transaction elements.

| Role | Color Name | HEX Code | CSS Variable / Tailwind | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | Background Black | `#121212` | `bg-[#121212]` | Base viewport body background |
| **Container** | Slate Gray | `#1E1E1E` | `bg-[#1E1E1E]` | Sidebar, Cards, Modals, Forms |
| **Border** | Dark Outline | `#2C2C2C` | `border-[#2C2C2C]` | Dividers, inputs, buttons, tables |
| **Primary Accent** | Cyber Indigo | `#6366F1` | `text-indigo-500` | Active links, primary buttons, logo |
| **Secondary Accent** | Neon Violet | `#818CF8` | `text-indigo-400` | Highlights, highlights in headings |
| **Text (Main)** | Soft White | `#FFFFFF` / `#E0E0E0` | `text-white` / `text-gray-200` | Headings, active values, button text |
| **Text (Muted)** | Cool Gray | `#A0A0A0` / `#777777` | `text-gray-400` / `text-gray-500` | Labels, details, descriptions |
| **Success Alert** | Emerald Mint | `#4ADE80` | `text-green-400` | Cleared invoices, clocked-in indicators |
| **Warning Alert** | Amber Gold | `#FBBF24` | `text-yellow-400` | Unsubmitted shifts, pending payouts |
| **Danger Alert** | Crimson Red | `#F87171` | `text-red-400` | Unpaid invoices, clocked-out status |

---

## 3. Typography System

The application relies on clean Sans-Serif typography (e.g., **Figtree**, **Inter**, or **Roboto**) paired with strict tracking.

*   **Primary Headings (`h2`, `h3`)**:
    *   Style: Bold, uppercase, wide letter-spacing.
    *   Tailwind: `text-xs tracking-widest font-bold uppercase text-white`
*   **Secondary/Section Labels**:
    *   Style: Muted cool gray, uppercase, tracking.
    *   Tailwind: `text-[10px] text-gray-500 uppercase tracking-widest`
*   **Monospace Details (Dates, Times, Durations)**:
    *   Style: Monospace tracking.
    *   Tailwind: `font-mono tracking-wider text-xs`
*   **Grand Totals / Currencies**:
    *   Style: Heavy font weight.
    *   Tailwind: `font-black text-white`

---

## 4. Layout & Navigation Blueprint

### A. Desktop View (Side Navigation)
*   **Sidebar Width**: Fixed `w-64` (256px).
*   **Sidebar Style**: Background `#1E1E1E`, border-right `1px solid #2C2C2C`.
*   **Logo Header**: Height `20` (80px), centered content, border-bottom `1px solid #2C2C2C`.
*   **Main Canvas**: Offset on left margin by `ml-64` to prevent overlap.
*   **Sticky Page Headers**: Background `#1E1E1E` with thin border bottom to anchors navigation.

### B. Mobile View (Sticky Header + Bottom Bar)
*   **Top Header**: Height `16` (64px), background `#1E1E1E`, border-bottom `1px solid #2C2C2C`. Contains the `ApplicationLogo`.
*   **Bottom Navigation**: Fixed to viewport bottom (`fixed bottom-0 w-full`), height `16` (64px), background `#1E1E1E`, border-top `1px solid #2C2C2C`.
*   **Bottom Navigation Actions**: Simple icons with tiny labels (`text-[9px] font-bold tracking-widest uppercase`).

---

## 5. Component Specifications

### A. Buttons
*   **Primary Action**:
    ```html
    <button class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors rounded-none">
      Save Changes
    </button>
    ```
*   **Secondary Action (Outlined)**:
    ```html
    <button class="border border-[#2C2C2C] hover:border-indigo-500 bg-[#1E1E1E] hover:bg-[#252525] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors rounded-none">
      Cancel
    </button>
    ```
*   **Danger Action**:
    ```html
    <button class="bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors rounded-none">
      Delete Record
    </button>
    ```

### B. Input Fields
*   Style: Deep canvas background, thin gray outline, zero outline focus.
    ```html
    <input type="text" class="block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-xs py-3 px-4" />
    ```

### C. Status Badges
*   **Cleared / Completed**:
    `text-green-400 border-green-500/30 bg-green-950/10 border text-[9px] font-bold tracking-widest uppercase px-2 py-0.5`
*   **Unpaid / Warning**:
    `text-red-400 border-red-500/30 bg-red-950/10 border text-[9px] font-bold tracking-widest uppercase px-2 py-0.5`

### D. Data Tables
*   **Header**: `#121212` background, `#2C2C2C` border bottom.
*   **Rows**: Alternating background or hover rows (`hover:bg-[#252525] transition-colors`).
*   **Bordering**: Horizontal borders only (`border-b border-[#2C2C2C]`).

---

## 6. Global Webkit Scrollbar Styling

Ensure consistent scrollbars inside custom scroll containers and main body to prevent standard default browser bars:

```css
/* Custom dark scrollbar styling */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #121212;
}

::-webkit-scrollbar-thumb {
    background: #2C2C2C;
    border-radius: 0px;
}

::-webkit-scrollbar-thumb:hover {
    background: #444444;
}
```
