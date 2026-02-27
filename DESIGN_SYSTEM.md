# KEICHA Design System Specification

This document defines the visual standards for the KEICHA project. It applies to the User Frontend and Admin Backend. Follow these rules to maintain consistency.

## 1. Color System

The system uses specific colors for brand identity and functional status.

| Token Name | Hex Code | Usage | Target Interface |
| :--- | :--- | :--- | :--- |
| `--brand-green` | `#6ea44c` | Primary actions and brand identity. | Both |
| `--brand-dark` | `#5d8d41` | Hover states for primary buttons. | Both |
| `--brand-light` | `#ebf1e9` | Backgrounds for highlighted sections. | Both |
| `--bg-page` | `#f8fafc` | Global background for all pages. | Both |
| `--text-main` | `#334155` | Primary readability for text. | Both |
| `--text-muted` | `#64748b` | Secondary icons and captions. | Both |
| `--border-std` | `#e5e7eb` | Structural borders and dividers. | Both |

## 2. Typography

The system uses specific font families for brand recognition, standard readability, and data clarity.

| Level | Desktop Size | Mobile Size | Weight | CSS Variable |
| :--- | :--- | :--- | :--- | :--- |
| `H1-Hero` | 64px | 40px | 700 | `--size-h1` |
| `H2-Title` | 32px | 24px | 700 | `--size-h2` |
| `H3-Sub` | 24px | 20px | 600 | `--size-h3` |
| `Body-L` | 18px | 18px | 400 | `--size-body-l` |
| `Body-std` | 16px | 16px | 400 | `--size-body` |
| `Label-md` | 14px | 14px | 600 | `--size-label` |
| `Note-sm` | 12px | 12px | 500 | `--size-note` |

### Font Families
- **Primary Font**: `Zen Maru Gothic` (`--font-brand`).
- **Secondary Font**: `Noto Sans TC` (`--font-body`).
- **Data/Display Font**: `JetBrains Mono` or `monospace` (`--font-mono`).
- **Icon Font**: `Material Symbols Rounded`.

### Container Widths
- **Maximum Width**: `1200px` (`--container-max`).
- **Narrow Container**: `800px` (`--container-narrow`).

## 3. Spacing & Grid (8pt System)

The system uses an 8pt grid for consistent distribution of space.

| Token | Value (px) | CSS Variable | Application |
| :--- | :--- | :--- | :--- |
| `Space-2XS` | 4px | `--s-2xs` | Inline icon padding. |
| `Space-XS` | 8px | `--s-xs` | Margin between check items. |
| `Space-SM` | 12px | `--s-sm` | Padding for mini buttons. |
| `Space-MD` | 16px | `--s-md` | Standard form gap. |
| `Space-LG` | 24px | `--s-lg` | Card internal padding. |
| `Space-XL` | 32px | `--s-xl` | Large layout margins. |
| `Space-2XL` | 64px | `--s-2xl` | Mobile section padding. |
| `Space-3XL` | 96px | `--s-3xl` | Desktop section padding. |

## 4. Corner Radius (Geometry)

The system uses four levels of corner rounding. This logic is same for User and Admin sections.

| Token Name | Value (px) | Component Type | Logic / Rule |
| :--- | :--- | :--- | :--- |
| `--r-sm` | 8px | Checkboxes, Nav Links | Small scale fixed elements. |
| `--r-md` | 16px | Buttons, Inputs, Cards | Actionable medium elements. |
| `--r-lg` | 24px | Main Containers, Modals | Structural large containers. |
| `--r-full` | 9999px | Pills, Badges, Dots | Maximum round for status. |

## 5. Component Standards

Follow these specific dimensions for core UI components.

| Component | Corner Radius | Spacing (Padding) | Border Width |
| :--- | :--- | :--- | :--- |
| Primary Button | `var(--r-md)` | 12px 24px | 0px |
| Input Field | `var(--r-md)` | 12px 16px | 1px |
| Data Table | `0px` | 12px 15px (Cell) | 1px (Bottom) |
| Order Card | `var(--r-md)` | 24px | 1px |
| Modal Content | `var(--r-lg)` | 32px | 0px |
