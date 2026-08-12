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

## 6. Status and Badge Terminology (狀態與標籤用語)

This section defines the standardized terminology and visual styles for all status badges (`.status-badge`) across the User Frontend and Admin Backend interfaces.

### Core Philosophy
- **Green (Active/Completed):** Brand Green background with White text (`background: #6ea44c; color: white;`). This signifies a positive, final, or actively running state.
- **Grey (Pending/Inactive):** Light Grey background with Dark Grey text (`background: #f1f5f9; color: #64748b;`). This signifies a waiting, cancelled, hidden, or out-of-stock state.

### 6.1 Unified Terminology Mapping

| Context | Status Definition (Traditional Chinese) | Assigned Color Scheme |
| :--- | :--- | :--- |
| **All Orders (訂單狀態)** | `待處理`, `已確認`, `已取消` | Grey |
| **All Orders (訂單狀態)** | `已完成` | Green |
| **Admin Products (管理介面商品狀態)** | `已隱藏`, `缺貨中` | Grey |
| **Admin Products (管理介面商品狀態)** | `啟用中` | Green |
| **User Products (使用者介面商品狀態)** | `缺貨中` | Grey |
| **User Products (使用者介面商品狀態)** | `可訂購` | Green |

### 6.2 CSS Implementation Guide

When implementing these statuses in HTML, apply the base `.status-badge` class along with the appropriate semantic color class.

```css
/* Base styling for all badges */
.status-badge {
    padding: 4px 10px;
    border-radius: 9999px; /* var(--r-full) */
    font-size: 0.85rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    border: 1px solid transparent;
}

/* Grey Theme: Pending, Confirmed, Cancelled, Hidden, Out-of-Stock */
.status-badge.pending,
.status-badge.confirmed,
.status-badge.cancelled,
.status-badge.out-of-stock,
.status-badge.hidden {
    background: #f1f5f9;
    color: #64748b;
    border-color: #e2e8f0;
}

/* Green Theme: Completed, Active, Available */
.status-badge.completed,
.status-badge.active-green,
.status-badge.available {
    background: #6ea44c; /* Brand Green */
    color: #ffffff; /* White */
    border-color: #5d8d41; /* Brand Dark Green for subtle border */
}
```
