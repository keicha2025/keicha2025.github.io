# Changelog

## [2026-02-28] - Logistics System Dynamic Refactor & Code Integrity Cleanup

### Summary of changes
Refactored the logistics management architecture to be fully data-driven, enabling dynamic delivery method configuration across all checkout interfaces. Performed an emergency recovery of the administrative module's source code, repairing corrupted script block hierarchies and JavaScript syntax errors caused by improper formatting tools.

### Technical details of implementation
- **Logistics Pool Integration**:
    - Refactored `fast.html` to eliminate hardcoded shipping methods (7-11, FamilyMart, Home Delivery).
    - Implemented a unified `renderLogisticsDynamic` engine that generates delivery cards, store lookups, and address inputs based on names fetched from the `shipping_methods` collection.
    - Integrated with `fast_checkout_config` using the new `enabled_methods` (array) and `fees_map` (object) schema.
- **Dynamic Fee Engine**: Updated `calcFastShip` to prioritize real-time fee mapping from Firestore, with graceful fallbacks for legacy configurations.
- **Admin Management Upgrades**:
    - Created a "Logistics Channel Pool" management interface in `admin.html`.
    - Implemented dynamic configuration generation in the Fast Checkout settings tab.
- **Code Integrity Fixes**:
    - Cleaned up corrupted HTML tags (e.g., `< div >` fixed to `<div>`) across administrative sub-modules.
    - Removed excessive spaces in template literals throughout the backup and data repair tools, ensuring reliable variable interpolation.
    - Corrected broken script attributes for link order management actions.

### Affected files or modules
- `admin.html`: Core administrative logic and UI cleanup.
- `fast.html`: Checkout rendering and order submission logic.
- `CHANGELOG.md`: Updated project history.

**中文摘要**：物流系統全面轉向「數據驅動」架構。現在管理員可在後台自由新增物流管道，前端 `fast.html` 會自動根據物流名稱產對應的輸入框（店號/地址）與運費。同時徹底清理了管理後台因格式化錯誤導致的亂碼與語法空格，恢復備份工具的穩定性。


## [2026-02-27] - Global Redirection Updates and UI Refinement

### Summary of changes
Optimized the user journey by redirecting various external LINE links to the internal contact page, synchronizing store links, and refining the contact page UI by removing redundant notifications.

### Technical details of implementation
- **Contact Page Refinement**: Removed the "已複製" (Copied) toast notification, its associated CSS keyframes, and JavaScript logic to keep the interface cleaner as per user request.
- **Typography Standardization**: Updated the "付款與下單專區" (Payment and Ordering Zone) header in `index.html` to use `text-2xl md:text-3xl`, ensuring visual consistency with the "服務項目" (Service Items) section.
- **Homepage Redirection**:
    - Updated "LINE 官方客服" (Hero & Footer sections) to link to `/contact.html`.
    - Updated "前往自填單" button to link to `/user-guide.html` for a better pre-purchase explanation.
    - Updated "私訊詢問" in the Matcha service section to link to `/contact.html`.
- **User Guide Updates**:
    - Linked "7-11 賣貨便下單" to the specific 7-11 store URL.
    - Linked "全家 好賣+ 下單" to the specific FamilyMart store URL.
- **Link Integrity**: Ensured all internal links use the Liquid `{{ site.baseurl }}` tag for consistent environment-based routing.
- **Micro-interactions**:
    - **Entry Animation**: Implemented a `fadeUp` CSS animation that slides the card up gracefully upon page load.
    - **Smart Input Selection**: The LINE ID field uses `onfocus="this.select()"` combined with a `tap-scale` pulse animation to provide immediate tactile feedback.
    - **Smooth QR Expansion**: Leveraged CSS `max-height` transitions instead of simple toggling to provide a sliding "drawer" effect for the QR code display.
- **Brand Alignment**: Enforced strict usage of KEICHA brand green (#6ea44c) across all UI elements, avoiding generic social media brand colors.

### Affected files or modules
- `contact.html` [NEW]: Dedicated contact interface.

### Chinese Summary
新建全站通用的「聯絡我們」頁面，作為 LINE 連結失效時的智慧替代方案。導入了由下而上的進場動畫、點擊自動全選 ID 並縮放回饋，以及平滑展開的 QR Code 抽屜式設計，全面提升品牌導航質感。

## [2026-02-27] - Home & Maccha Store UI Text Adjustments

### Summary of changes
Updated homepage and maccha store index text copy and button labels to improve user navigation clarity and match current requirements. Removed icons from specific buttons and updated section links.

### Technical details of implementation
- **Homepage (`index.html`)**:
  - Updated the hero section KEICHA title CSS classes to `text-3xl md:text-5xl brand-title-font font-bold tracking-widest leading-tight`.
  - Replaced the text "前往" in the store-to-store checkout section with "前往自填單" (removed icon) and directed it to `/diy.html`.
  - Updated the Maccha order buttons to "私訊詢問" and "抹茶品項" (directing to `/maccha-store.html`) while removing icons.
  - Substituted the phone service buttons with "服務介紹" (`/denwa.html`) and "線上填表" (`/denwa-form.html`) and stripped their icons.
- **Maccha Layout (`maccha.html`)**:
  - Modified the "官網下單" button copy to "前往抹茶商店" and "整合自填單".
  - Renamed the "超商平台自填單" link texts from "前往" to "7-11 賣貨便" and "全家 好賣+".

### Affected files or modules
- `index.html`: Hero banner and main service category button components.
- `maccha.html`: Outbound link buttons for internal store and external convenience store platforms.

### Chinese Summary
優化首頁與抹茶總覽頁面的文案與按鈕標籤。移除了部分按鈕的圖示使畫面更簡潔，並精確標示如「前往自填單」、「7-11 賣貨便」等文字，讓使用者導航更直覺。

## [2026-02-27] - Autofill & Store Integration Fix for Checkout Pages

### Summary of changes
Fixed a critical bug where member store data (7-11, Fami) and shipping addresses were failing to populate during checkout. Aligned the HTML card structure and DOM query logic across all checkout pages to reliably retrieve and save customer delivery details.

### Technical details of implementation
- **HTML Structure Alignment**: In `fast.html` and `card-order.html`, added `data-method="${method}"` to the logistics cards to match the functional pattern found in `diy.html`.
- **Input ID Restructuring**: Standardized the store input IDs to `store-id-${method}` across all checkout forms to prevent mismatch with the autofill routines.
- **Autofill Robustness**: Updated `fillFormWithData` and `lookupPhoneData` functions to use `card.dataset.method` for checking logistics methods instead of relying on regex replacements of the parent DOM ID or non-existent attributes.

### Affected files or modules
- `fast.html`: Card generation and autofill logic constraints.
- `card-order.html`: Data binding and submission flow.

### Chinese Summary
修復了「快速結帳」與「專屬付款連結」頁面無法帶入門市與地址資料的問題，統一 HTML 屬性 `data-method` 與 DOM 選取邏輯，確保每次都能精準帶入歷史物流資料。

## [2026-02-27] - Denwa Order Price Persistence & UI Enhancements

### Summary of changes
Fixed the issue where phone-assisted orders (`denwa_orders`) displayed an amount of 0 and improved the order tracking UI to hide internal tracking suffixes.

### Technical details of implementation
- **Price Persistence (`denwa-form.html`)**: Added code to save the selected plan's price into the `total` field in Firestore during submission.
- **UI Suffix Removal (`order.html`)**: Updated the display logic to use `order_id` instead of the full `tracking_code`, effectively hiding the 4-character random suffix from customers.
- **Enhanced Details (`order.html`)**: 
  - Added a dedicated itemized layout for `denwa_orders` that includes the merchant name, service date/time, and a breakdown of adult/child attendees.
  - Refined seller reply priority to show `public_reply` consistently.
- **Search Mapping (`jyoukyou.html`)**: Improved field mapping to correctly pull and display prices for phone orders.

### Affected files or modules
- `denwa-form.html`: Order submission logic.
- `order.html`: Order detail tracking page.
- `jyoukyou.html`: Order status query page.

### Chinese Summary
修正電話訂單金額顯示為 0 的問題，確保下單時會正確紀錄方案金額。同時優化前端介面，移除訂單詳情頁中的亂碼後綴，並補全電話預約專屬的日期、時間與人數細節顯示。

 
## [2026-02-27] - Denwa Orders Search & Storage Consistency Fix
 
### Summary of changes
Resolved the issue where phone-assisted orders (`denwa_orders`) were unsearchable by Order ID on the tracking page. Standardized the storage mechanism to align with other order collections.
 
### Technical details of implementation
- **Search Logic Update (`jyoukyou.html`)**:
    - Changed the `denwa_orders` lookup from `.doc(id).get()` to `.where('order_id', '==', rawOrderId).limit(1).get()`.
    - This ensures legacy orders with random-string Document IDs are correctly retrieved via their human-readable `order_id` field.
    - Updated result mapping to prioritize the `order_id` field for display consistency.
- **Storage Standardization (`denwa-form.html`)**:
    - Replaced `.add(payload)` with `.doc(orderId).set(payload)` during order submission.
    - Newly created phone orders now use the formatted Order ID (e.g., `DENWA-25022701`) as their primary Firestore Document ID, matching the behavior of `orders` and `card_orders`.
 
### Affected files or modules
- `jyoukyou.html`: Cross-collection search logic.
- `denwa-form.html`: Order submission and persistence logic.
 
### Chinese Summary
修復電話代撥訂單無法透過編號查詢的問題。將查詢邏輯改為欄位比對以兼容舊資料，並同步將下單流程改為以訂單編號作為資料庫主鍵，確保全站訂單儲存格式一致。
 


## [2026-02-27] - Universal Order Detail Page & Tracking Code Support

### Summary of changes
Implemented a high-end universal order detail page (`order.html`) based on a vertical linear layout design. Introduced the `tracking_code` system (Format: `OrderID-4DigitRandomSuffix`) across all order-taking modules to enable secure, unguessable order status tracking for customers.

### Technical details of implementation
- **Unified Order Detail Page (`order.html`)**:
    - Developed a premium UI using a linear vertical timeline to display order progress and detailed line items.
    - Implemented cross-collection searching logic that scans `orders`, `denwa_orders`, and `card_orders` using the `tracking_code`.
    - Integrated with KEICHA design tokens for consistent rounded corners, spacing, and typography.
    - Added responsive "Contact Support" entry point and order status tracking.
- **Tracking Code Generation**:
    - Updated `maccha-store.html`, `denwa-form.html`, and `fast.html` to generate and persist a `tracking_code` upon order submission.
    - Used a safe character set (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) to generate the 4-character random suffix to avoid ambiguous characters like `0/O` or `1/I`.
- **Legacy Data Backfill**:
    - Added a "Database Repair & Completion" tool in `admin.html`.
    - Implemented `backfillTrackingCodes` function to scan existing orders and generate retrospective tracking codes using the last 4 characters of Firebase Document IDs for historical consistency.
- **URL Structure Alignment**: Standardized the public tracking URL format to `order.html?id=[TrackingCode]`.
- **Layout Integration**: Applied the `default` site template to `order.html` to include the global header and footer. Fully integrated with KEICHA design tokens (typography, spacing, and radius) for seamless site-wide consistency.

### Affected files or modules
- `order.html` [NEW]: The universal tracking interface with site-wide layout integration.
- `maccha-store.html`, `denwa-form.html`, `fast.html`: Order submission logic updates.
- `admin.html`: Maintenance tool addition and UI updates.

### Chinese Summary
實作全站通用的「訂單詳情頁」與「查單追蹤碼」系統。現在所有新訂單都會自動產生格式如 `M26022701-A8B9` 的查詢碼，並同步在後台加入「資料補回工具」。此外，訂單詳情頁已整合全站 Layout（頁首/頁尾），確保品牌視覺一致性。


## [2026-02-26] - Typography & Spacing System Optimization

### Summary of changes
Optimized the design system by fully tokenizing Typography and Spacing scales. This update transitions the project from static values to a centralized, variable-driven engine, ensuring consistent information density and visual hierarchy across all devices.

### Technical details of implementation
- **CSS Variable Centralization**: Defined comprehensive design tokens in `_layouts/default.html`:
    - **Spacing (8pt)**: Added `--s-2xs` (4px) to `--s-3xl` (96px).
    - **Typography**: Defined `--size-h1` to `--size-note` for responsive text scaling.
    - **Font Families**: Added `--font-mono` for data/code blocks and standardized brand/body font variables.
    - **Container Widths**: Defined `--container-max` (1200px) and `--container-narrow` (800px).
- **Design System Documentation**: Updated `DESIGN_SYSTEM.md` with mapping between design levels and CSS variables.
- **Implementation Refinement**:
    - Replaced hardcoded Tailwind padding and text sizes in `index.html` with variable-based Tailwind classes (e.g., `py-[var(--s-3xl)]`).
    - Standardized Section and Hero typography to align with the new H1/H2 scale.

### Affected files or modules
- `_layouts/default.html`, `index.html`, `DESIGN_SYSTEM.md`

### Chinese Summary
優化字體與間距系統：將全站 Typography 與 Spacing 全面「Token 化」並建立 CSS 變數引擎。定義了 8pt 系統間距、多層級響應式字階、以及數據專用字體。同步更新了首頁與設計規範文件，讓代碼從手寫數值進化為數據驅動的設計系統。



## [2026-02-25] - Unified Border Radius System & Design Standardization

### Summary of changes
Implemented a consistent border-radius system across the entire project, defining four core levels (8px, 16px, 24px, 9999px) and applying them systematically to all components. This update enhances visual harmony and ensures a premium, high-quality aesthetic across all user-facing and administrative interfaces.

### Technical details of implementation
- **Global Design Tokens**: Defined `--r-sm: 8px`, `--r-md: 16px`, `--r-lg: 24px`, and `--r-full: 9999px` in `_layouts/default.html` for site-wide availability.
- **Component Alignment**:
    - **Large (24px)**: Applied to main containers, cards, and sections (`.section-card`, `.login-card`, `.modal-content`, `section.bg-white`).
    - **Medium (16px)**: Applied to input fields, primary buttons, and interactive labels (`.diy-input`, `.btn`, `.order-card`).
    - **Small (8px)**: Applied to nested elements, secondary buttons, and navigational links (`.note-box`, `.nav-link`, `.dropdown-menu`).
    - **Full (9999px)**: Applied to status badges, pills, and specialized round elements (`.status-badge`, `.slider-dot`, `.loader`).
- **Global Checkbox Styling**: Standardized the border-radius of the custom KEICHA checkbox to 8px within the root layout.
- **Legacy Cleanup**: Replaced all hardcoded values and localized Tailwind `rounded-` classes with CSS variable-based definitions for improved maintainability.

### Affected files or modules
- `_layouts/default.html`, `_includes/header.html`, `_includes/footer.html`, `_includes/contact-section.html`
- `admin.html`, `index.html`, `denwa.html`, `maccha.html`, `jyoukyou.html`, `privacy.html`
- `card-order.html`, `denwa-form.html`, `diy.html`, `maccha-store.html`
- `css/ui-dialog.css`

### Chinese Summary
統一全站圓角系統：定義四個核心圓角等級（8px/16px/24px/全圓角），並將其應用於全站組件、容器與按鈕。透過 CSS 變數標準化全站設計語言，顯著提升了介面的精緻感與一致性，並同步優化了全域 Checkbox 與首頁導覽列的視覺細節。



## [2026-02-25] - Global Shipping Methods Centralization & UI Refinement

### Summary of changes
Refined the shipping management system by splitting it into "Shipping Methods" (Global Presets) and "Shipping Rules" (Dynamic Tiers). Added an automated initialization tool for standard Taiwan logistics (7-11, FamilyMart, Home Delivery) and unified the tiered fee interface across all modals.

### Technical details of implementation
- **Shipping Methods (Presets)**: 
    - Implemented `initDefaultShippingMethods()` to bulk-add standard 7-11/FamilyMart/Home methods with pre-configured lookup URLs.
    - Enhanced the method management UI to display query links with icons and shortened URLs.
    - Clarified "Query Link" usage in modals for better admin UX.
- **Shipping Logic Consolidation**: Thoroughly applied the "Logistics Channels Pool" (global methods) across `fast.html`, `card-order.html`, `maccha-store.html`, and `diy.html`. Front-end logistics options now prioritize tracking links defined in the global pool.
- **Admin UI Cleanup**: Removed the "Initialize Default Methods" button from the shipping tab as per user request. Fixed redundant padding in the logistics pool container.
- **UI Aesthetic Corrections**:
    - Changed all delete icons from red to neutral gray (#64748b) in shipping, card links, and brand list modules.
    - Simplified error messages and warnings to use neutral gray.
    - Updated required field indicators to use brand green.

### Affected files or modules
- `admin.html`: UI cleanup, removed init button, fixed icon colors.
- `fast.html`, `card-order.html`, `maccha-store.html`, `diy.html`: Updated to fetch and use global shipping methods.
- `firestore.rules`: Updated to allow public read of `shipping_methods`.

### Chinese Summary
優化運費與物流邏輯：將「物流管道池」設定徹底套用至全站所有結帳頁面，確保查詢連結變動時可同步更新。移除後台物流初始化按鈕以利手動配置、修復多處 UI 色調（刪除圖示改為中性灰、必填星號改為品牌綠），並精簡了物流管道容器的間距。

## [2026-02-24] - Dynamic Logistics System, KUI Dialog Component & Pre-Release Audit Fixes

### Summary of changes
Refactored logistics system to be fully dynamic (data-driven from Firestore). Implemented a custom KEICHA-branded dialog component (KUI) replacing all native browser `alert()` and `confirm()` calls. Performed comprehensive pre-release audit and fixed 6 bugs.

### Technical details of implementation
- **Dynamic Logistics Engine**: Removed hardcoded 7-11/FamilyMart/Home Delivery blocks from `maccha-store.html` and `diy.html`. New `renderLogistics()` function dynamically generates shipping option cards based on `shipping_rules` Firestore collection, filtered by page category.
- **KUI Dialog System**: Created `css/ui-dialog.css` and `js/ui-dialog.js`. Provides `KUI.alert()`, `KUI.confirm()`, and `KUI.toast()` with Promise-based API, glassmorphism backdrop, scale-in animation, and strict brand color palette (green #6ea44c, white, gray).
- **Cart UX Enhancement**: Quantity `-` button at qty=1 now triggers `KUI.confirm('確定要移除此商品嗎？')` instead of being disabled.
- **Pre-Release Audit Fixes**:
  - Restored accidentally deleted `lookupPhoneData()` in `diy.html`
  - Unified dynamic element IDs to use `method` (removed `rule.id || method` inconsistency)
  - Rewrote `saveCheckoutForm`/`loadCheckoutForm` for dynamic logistics IDs
  - Fixed checkout validation `.focus()` to target dynamic elements
  - Removed duplicate `</script>` tag in `diy.html`
  - Fixed `return KUI.alert(...)` semantic pattern in `admin.html`
- **Notification System Fixes**:
  - Restored missing `js/api.js` in `maccha-store.html` to enable email notifications.
  - Fixed `order_id` field passing in `admin.html` to ensure order numbers appear in emails.
  - Updated `gas/firebase_handler.gs` email template to use brand name "KEICHA" and simplified terminology.

### Affected files or modules
- `maccha-store.html`: Dynamic logistics, KUI integration, cart decrement, save/load/validate fixes
- `diy.html`: Dynamic logistics, KUI integration, restored lookupPhoneData, syntax fixes
- `admin.html`: KUI integration (50+ alert, 5 confirm replacements)
- `css/ui-dialog.css` [NEW]: Dialog styles
- `js/ui-dialog.js` [NEW]: Dialog logic

### Chinese Summary
重構物流系統為全動態架構（從 Firestore 讀取規則自動生成前端選項）。實作品牌對話框組件 KUI 取代所有原生 alert/confirm。購物車數量扣至 0 時觸發品牌確認視窗。完成全面預發布審計並修復 6 個 Bug。

## [2026-02-11] - Checkout Logic & UI Reordering

### Summary of changes
Implemented comprehensive checkout logic for the KEICHA SHOP, including payment selection, dynamic logistics, two-phase payment, and UI flow optimizations.

### Technical details of implementation
- **Payment Method Selection**: Implemented COD and Credit Card/Transfer options.
- **Hidden Surcharge**: Credit card surcharges are now dynamically included in the shipping fee display and calculation without explicit labels, adhering to gateway policies.
- **Dynamic Logistics**: Implemented filtering logic to show/hide delivery options based on cart product types (`logistics_type`) and shop configuration.
- **Two-Phase Payment**: Added logic to calculate and display deposit and remainder for eligible orders (based on product flags and $1000 total threshold).
- **Inline Order Success**: Replaced `alert()` with a dedicated success screen in the checkout panel.
- **UI Flow Optimization**: Reordered the checkout section to display "Payment Method" before "Logistics Delivery" to better guide the user.

### Affected files or modules
- `shop/index.html`: Reordered sections and added UI elements for payments and success state.
- `shop/shop.js`: Implemented the core checkout and filtering logic.
- `js/supabase-api.js`: Added checkout and product fetching functions.

### Chinese Summary
實作了完整的結帳邏輯，包含付款加價隱藏計算、物流自動過濾、兩階段付款提示以及結帳成功畫面。
同時優化介面佈局，將付款方式調整至配送方式上方，引導使用者更直覺地完成選購。

## [2026-02-19] - Migrate Admin Panel to Firebase

### Summary of changes
Migrated the KEICHA Admin Panel's backend from Supabase to Firebase, including Authentication and Data Storage (Firestore).

### Technical details of implementation
- **Authentication**: Replaced Supabase Auth with **Firebase Authentication (Google Sign-In)**.
- **Authorization**: Implemented strict email whitelist check (allowed: `wj209ing@gmail.com`).
- **Database Migration**: Refactored all data-fetching and CRUD logic in `admin.html` to use **Firebase Firestore SDK (v9 compat)**.
- **Data Collections**: Migrated `matcha_orders`, `denwa_orders`, `matcha_brands`, `matcha_products`, `denwa_plans`, `shipping_rules`, and `fast_checkout_config`.
- **Concurrency & Compliance**: Used `FieldValue.serverTimestamp()` for all `updated_at` fields to ensure server-side consistency.
- **Cleanup**: Removed obsolete Supabase script references from `admin.html`.

### Affected files or modules
- `admin.html`: Significant script refactoring and SDK integration.
- `CHANGELOG.md`: Added project migration history.

### Chinese Summary
將 KEICHA 管理後台從 Supabase 全面遷移至 Firebase。
身份驗證改用 Firebase Google 登入並限制指定管理員信箱，資料庫存取 logic 全部改寫為 Firestore，並導入伺服器端時間戳記以確保資料一致性。
同時清理了相關過時的 Supabase 依賴。

## [2026-02-25] - Admin Order Management Fixes & Checkout UI Alignment

### Summary of changes
Resolved critical issues in the admin panel's order management and successfully aligned the `card-order.html` checkout page with the premium aesthetics of `fast.html`.

### Technical details of implementation
- **Admin Panel Logistics Fix**: Implemented robust fallback logic for logistics data display in `admin.html` (checking `logistics_type`, `store_id`, `shipping_address`, etc.) to eliminate "undefined" values.
- **Link Order Management**: Enhanced the "Link Orders" table in `admin.html` with updated headers and added an "Actions" column featuring Info, Edit, and Delete functionality.
- **Fast Checkout Configuration**: Updated the admin interface for fast checkout to include fee toggles, amount inputs, and status controls with integrated saving logic.
- **Card-Order UI Overhaul**: Re-engineered `card-order.html` from the ground up to match the premium, card-based UI of `fast.html`. 
    - Reordered sections to prioritize recipient info and order summary.
    - Implemented card-based logistics and payment selection.
    - Added 7-11/FamilyMart store lookup integration.
- **CSS Consolidation**: Synchronized brand colors and component styles between `fast.html` and `card-order.html` for a seamless customer experience.

### Affected files or modules
- `admin.html`: Updated `loadCardOrders`, added link order CRUD functions, and fast checkout config UI.
- `card-order.html`: Major structural and styling overhaul.

### Chinese Summary
修復管理後台「連結訂單」表格標題與物流資訊顯示問題（解決 undefined 並補上操作按鈕）。同步將 `card-order.html` 結帳頁面改裝為與 `fast.html` 一致的高級卡片式設計，並優化填寫流程與門市查詢整合。

---

## [2026-02-19] - Finalized Firebase Migration & Supabase Cleanup

- **Actions Performed**:
  - Migrated Shop Frontend (`shop/shop.js`) data fetching and checkout logic to Firestore.
  - Implemented secure member lookup with two-phase verification (masking + name confirmation).
  - Created `seed.html` with Firebase Authentication for secure data initialization.
  - Updated `firestore.rules` to allow public read for store collections and restricted write for admin.
  - Removed all Supabase SDK references and `js/supabase-api.js`.
  - Deleted legacy `supabase/` configuration directory.
- **Affected Files**: `shop/shop.js`, `shop/index.html`, `seed.html`, `firestore.rules`, `admin_fast.html`, `denwa-form.html`, `maccha-store.html`.
- **Note**: The system is now 100% running on Firebase.


## [2026-02-19] - Brand Font Implementation & Database Refinement

### Summary of changes
Completed site-wide branding refinement by applying the brand font to all "KEICHA" instances and resolved legacy date/time formatting issues. Continued full Firebase migration by moving order tracking and updating security rules.

### Technical details of implementation
- **Brand Font Consistency**: Created global `.font-brand-text` class and applied it to "KEICHA" text across `index.html`, `denwa.html`, `jyoukyou.html`, `admin.html`, and `footer.html`.
- **Dynamic Font Styling**: Updated `privacy-loader.js` and `maccha-loader.js` to automatically wrap "KEICHA" in product/legal text with the brand font styling.
- **Date/Time Standardization**: Fixed legacy ISO date strings in `seed.html` and unified field names to `service_date`/`service_time` across the frontend and backend.
- **Order Tracking Migration**: Ported `jyoukyou.html` from Google Apps Script (GAS) to Firebase Firestore, enabling direct real-time order lookups.
- **Product Data Standardization**: Unified `matcha_products` structure to support `price_multi` (multi-buy discount), `max_limit`, and `image_url`.
- **Security Rules Update**: Refined `firestore.rules` to strictly control public access while supporting new booking and tracking features.
- **Admin Fix (Denwa Orders)**: Resolved "undefined" merchant name by unifying `merchant_name` field usage and implemented robust date/time formatting to handle ISO strings.

### Affected files or modules
- `_layouts/default.html`, `admin.html`: Global style definitions.
- `index.html`, `denwa.html`, `jyoukyou.html`, `footer.html`: UI branding updates.
- `assets/js/*.js`: Content loading logic updates.
- `seed.html`, `denwa-form.html`: Data consistency and field mapping.
- `firestore.rules`: Security configuration.

### Chinese Summary
完成全站 "KEICHA" 品牌字體套用與日期格式修復。將「訂單追蹤」系統從 GAS 遷移至 Firebase，並更新安全規則以確保資料轉移後的存取安全性。

## [2026-02-21] - Fix Multi-Item Discount ID Matching Issue

### Summary of changes
Fixed a critical bug in `maccha-store.html` where multi-item discounts were incorrectly grouped and cross-applied between different brands, and ensured the order list displays the human-readable brand name instead of the raw `brand_id`.

### Technical details of implementation
- **Brand ID Mapping**: Updated the `addToCart` function to extract and store `productData.brand_id` instead of the non-existent `brand_key` from the Firestore dataset. This ensures that the cart groups items by their actual brand accurately.
- **Cart Subtotal Calculation**: The `brandCounts` logic now correctly tallies items by `brand_id`, ensuring that the `qty > 1` condition is strictly isolated to specific brands.
- **Payload Format**: Updated the `itemsStr` generation logic used during checkout to prioritize `item.brandName` over `item.brand_key`. This guarantees that the final payload sent to the backend and recorded in Firestore displays the user-friendly brand name (e.g., "日日記" instead of "nichi_nichi").

### Affected files or modules
- `maccha-store.html`: Fixed cart `brand_key` assignment and string formatting for the final checkout payload.

### Chinese Summary
修正了 `maccha-store.html` 購物車加購物時因為抓錯屬性 (`brand_key` 應為 `brand_id`) 導致所有品牌商品全部被算在一起的折扣判斷 Bug。
同時修改了結帳送出的 payload 字串，讓後台訂單可以正確顯示品牌的中文名稱 (brandName) 而非英文 ID。

## [2026-02-21] - Re-position Multi-Item Discount Badge

### Summary of changes
Moved the "multi-item discount applied" badge in the `maccha-store.html` cart UI from a brand-level top banner to a more precise, item-level inline label next to the discounted price.

### Technical details of implementation
- **UI Refactoring**: Removed the `isDiscountActive` block that rendered the wide `bg-brandLight` banner above each brand's item list in `renderCartItems()`.
- **Inline Badge**: Added an inline tag with the text "多件優惠" alongside the strikethrough original price for items where `isMultiPriceApplied` is true, keeping users informed contextually per item.

### Affected files or modules
- `maccha-store.html`: Modified HTML string output within the cart rendering logic.

### Chinese Summary
優化了購物車內「多件優惠」的顯示邏輯，移除原本在品牌群組上方的橫幅，改為直接將精緻的小標籤顯示在有套用優惠的單項商品價格旁邊，讓優惠的對應關係更精準直覺。

## [2026-02-21] - Checkout Persistence and Readonly UI Upgrade

### Summary of changes
Implemented LocalStorage persistence for the shopping cart and checkout form to prevent data loss on page refresh, and upgraded the checkout phase "Readonly Order List" UI.

### Technical details of implementation
- **Cart Persistence**: Automatically serialize the `cart` to `localStorage['keicha_cart']` inside `renderCartItems()`, and parse it back upon initial `window.load`.
- **Form Persistence**: Added `saveCheckoutForm()` triggered by `input` events on the `#order-form`, storing customer info, logistics selection, and store details into `localStorage['keicha_checkout_form']`.
- **Form Restoration**: Created `loadCheckoutForm()` to cleanly map stored fields back into the DOM, triggered automatically within `openCheckout()`.
- **Data Cleanup**: On successful order creation, both `keicha_cart` and `keicha_checkout_form` are cleared from `localStorage`.
- **UI Upgrade**: Rewrote `updateCheckoutReadonlyList()` to display items with a more spacious modern list style, including `品牌｜品名` tags and an explicit `多件優惠` indicator, improving glanceability during final confirmation.

### Affected files or modules
- `maccha-store.html`: Comprehensive updates to the script block covering rendering and state management. Also restored missing `brandGreen` Tailwind config definition to fix global header styles on this specific page.

### Chinese Summary
全面導入 LocalStorage 網頁暫存機制，現在使用者的購物車內容、以及結帳填寫到一半的表單資訊都會被安全暫存，重新整理後不再遺失（結帳成功後便會自動清空）。同時美化了結帳最後一關的「商品確認列表」，讓資訊更清楚且同樣能顯示原本的折扣標示。並修復了本頁面頁首「聯絡我們」按鈕樣式消失的問題。

## [2026-02-21] - Custom Consecutive Order ID Format

### Summary of changes
Replaced default random Firestore document IDs with custom consecutive order IDs prefixed by page categories (M, D, F) followed by the current date and a 2-digit serial number.

### Technical details of implementation
- **Transaction-based Counter**: Implemented `generateOrderId` function across storefront pages. It uses `db.runTransaction` toward the `order_counters` collection to safely fetch and increment a daily counter for a specific prefix, ensuring race conditions are avoided.
- **Security Rules**: Added `match /order_counters/{docId} { allow read, write: if true; }` to `firestore.rules` to permit public execution of these transactions.
- **Prefix Conventions**: `maccha-store.html` uses `M`, `diy.html` uses `D`, and `fast.html` uses `F`.
- **Firestore Write Mode**: Switched `.add()` usage to `.doc(orderId).set()` in the checkout logic in order to force Firestore to use the customized string as the document ID.

### Affected files or modules
- `firestore.rules`: Permitted read/write to `/order_counters`.
- `maccha-store.html`: Included `generateOrderId('M')`.
- `diy.html`: Included `generateOrderId('D')`.
- `fast.html`: Included `generateOrderId('F')`.

### Chinese Summary
廢除了預設過長的亂碼訂單編號，全面導入自訂的「頁面字首＋日期＋兩位數流水號」格式（例如將抹茶代購店改為 M26022101）。各個下單頁面在送出時會自動利用後台進行安全鎖定的交易計數，避免客人同時結帳時拿到重複號碼。

## [2026-02-21] - Centralized Data Collections & Reply Notifications

### Summary of changes
1. Migrated `matcha_orders` and `matcha_members` to `orders` and `members` collections respectively across all frontend apps and Firestore rules.
2. Implemented automated email notifications when an admin replies to a customer via the store backend.

### Technical details of implementation
- **Data Collection Standardization**: Replaced all references to `matcha_orders` and `matcha_members` with unified `orders` and `members` collections to achieve architecture consolidation across custom-built applications (`maccha-store.html`, `diy.html`, `fast.html`, etc.).
- **Store Reply Mechanism**: Modified `saveOrder()` method within `admin.html` logic. It now fetches the old payload and executes the API wrapper `window.API.sendNotification('matcha_reply')` if `seller_note` contains updated text.
- **GAS Dispatcher Module**: Upgraded `gas/firebase_handler.gs` to consume POST payload with attribute `matcha_reply` representing the target trigger. Introduced the new `handleMatchaReply()` function that leverages `GmailApp.sendEmail` with a stylized HTML layout containing the seller's updated comment.

### Affected files or modules
- `firestore.rules` (Updated collections bindings)
- Frontend client logics: `maccha-store.html`, `diy.html`, `fast.html`, `admin.html`, `shop/shop.js`, `jyoukyou.html`, `seed.html`
- Google Apps Script: `gas/firebase_handler.gs`
- Documentation: `DATABASE_SCHEMA.md`

### Chinese Summary
整理與統一了資料庫集合名稱（改為跨頁面共用的 orders 與 members）。除此之外，開通了管理員後台針對購物訂單的「回覆通知」功能：只要管理員在後台的「賣家備註」欄位填寫新訊息，儲存後系統就會自動發送官方的 Email 回覆通知信給客人，與之前的代撥服務回覆體驗看齊。

## [2026-02-21] - Fix Member Data Sync on Checkout

### Summary of changes
Fixed a bug where checking "會員自動帶入" (Save/Update member logic) during checkout did not save customer details to the `members` collection. Empowered the frontend to save basic data while updating Firebase Rules to allow public writes to `members`.

### Technical details of implementation
- **Frontend Logic**: Re-implemented the `members` update block in `maccha-store.html`, `diy.html`, `fast.html`, and `shop/shop.js` to trigger a `members`.add() or .update() depending on if the `phone` already exists, ONLY when the option is checked.
- **Firebase Rule Relaxation**: Changed `firestore.rules` for the `/members/{docId}` path to `allow read, write: if true;` enabling anonymous checkout sessions to create their own customer profiles.
- **Email Notifications Trigger**: Explicitly forced `window.API.sendNotification('new_matcha_order', ...)` inside the final `.then()` resolving blocks natively in `maccha-store.html`, `diy.html`, and `fast.html` to guarantee new order receipts.

### Affected files or modules
- `firestore.rules`
- `maccha-store.html`, `diy.html`, `fast.html`, `shop/shop.js`

### Chinese Summary
修復了結帳最後一關勾選「會員自動帶入/儲存資料」卻不會真實存入後台資料庫的 Bug。前端代碼已完整補上針對 `members` 集合的查找或新建邏輯，同時開放了此路徑的 Firebase 寫入權限，並順手補齊了各個獨立頁面該有的「新訂單推播通知信」觸發 API 呼叫。

## [2026-02-28] - Fixed DIY Result Page Data Persistence

### Summary of changes
Resolved an issue where the DIY checkout result page (`fast-diy-result.html`) incorrectly displayed "No data found" after a successful order submission.

### Technical details of implementation
- **Data Passing**: Modified `diy.html` to store order details (Order ID, Name, Items, Total, etc.) in `sessionStorage` under the key `orderResult` before redirecting.
- **Result Retrieval**: This ensures `fast-diy-result.html` can successfully retrieve and display the order confirmation details immediately after the user is redirected, preventing the "page expired" error.

### Affected files or modules
- `diy.html`: Added session storage logic to the checkout completion callback.

### Chinese Summary
修正 DIY 頁面結帳後跳轉錯誤：現在結帳完成後會正確將訂單資訊存入暫存空間，解決 `fast-diy-result.html` 顯示「查無資料」的問題。

## [2026-02-21] - Admin Panel Mobile UI Optimization

### Summary of changes
Optimized the Admin Panel for mobile devices to prevent layout breaking and improve accessibility.

### Technical details of implementation
- **Logout Button**: Changed the logout button to an icon-only style on mobile to save header space.
- **Responsive Tables**: Implemented `denwa-table-responsive` and `orders-table-responsive` which hide non-essential columns (like IDs or dates) and stack text for better fit on narrow screens.
- **Card Header Layout**: Created `card-header-flex` to automatically switch between horizontal and vertical layouts for card titles and status badges based on screen width.
- **Modal Adjustments**: Reduced padding for modals and forced grid layouts into single columns on mobile to prevent horizontal scrolling.
- **Text & UI Refinement**: Simplified category displays and adjusted font sizes for improved readibility.

### Affected files or modules
- `admin.html`: CSS and HTML structure updates for mobile responsiveness.

### Chinese Summary
優化管理後台在行動裝置上的顯示體驗：將「登出」改為圖示以節省空間，重構預約與訂單表格以防止橫向錯位，並導入響應式標題佈局，確保運費規則與方案設定在小螢幕上依然整齊美觀。

## [2026-02-21] - Final GAS Migration & API Cleanup

### Summary of changes
Completed the final transition from Google Apps Script (GAS) to Firebase, ensuring all data fetching is handled by Firestore and cleaning up legacy API code.

### Technical details of implementation
- **Matcha Overview Migration**: Migrated the data source for `maccha.html` from GAS to Firestore. Added Firebase SDK and config to the page.
- **Loader Refactoring**: Updated `maccha-loader.js` to fetch `matcha_brands` and `matcha_products` in parallel and map them to the existing UI rendering logic.
- **API Consolidation**: Stripped `js/api.js` of all obsolete GAS endpoints (`MATCHA`, `CORE`, `DENWA`) and methods, retaining only the notification service for email alerts.
- **Full Firebase Transition**: The project is now 100% migrated to Firebase for all data operations, with GAS remaining only as a mail server proxy.

### Affected files or modules
- `maccha.html`: Added Firebase dependencies.
- `assets/js/maccha-loader.js`: Updated data fetching logic.
- `js/api.js`: Cleaned up dead code and legacy endpoints.

### Chinese Summary
完成最後一哩路的 GAS 遷移：將「抹茶狀態總覽頁」改為直接從 Firestore 抓取資料，並大幅清理了 `js/api.js` 中所有過時的舊端點與程式碼。目前全站除了郵件通知外，其餘後端功能已 100% 運行於 Firebase。

## [2026-02-21] - Fix Plan List Container Layout & Deployment

### Summary of changes
Fixed a critical layout breaking bug in the Admin Panel's Plan List and successfully re-deployed the entire site to Firebase Hosting.

### Technical details of implementation
- **HTML Structure Fix**: Resolved a broken HTML structure in `admin.html` where an extra `</div>` tag caused the plan card contents to overflow from their container.
- **Card UI Optimization**: Forced plan cards to use vertical flex layout (`flex-direction: column`) with `justify-content: space-between` to ensure buttons always align perfectly at the bottom, regardless of description length.
- **Jekyll Build Fix**: Corrected persistent YAML indentation issues in `maccha.html` that were blocking the build pipeline.
- **Successful Deployment**: Executed full Jekyll build and Firebase Hosting deployment.

### Affected files or modules
- `admin.html`: Fixed plan card template string logic.
- `maccha.html`: Refined frontmatter indentation.

### Chinese Summary
修復了管理後台「方案列表」容器跑版的 Bug（因多出一個閉合標籤導致卡片結構崩潰）。優化了卡片佈局讓按鈕自動置底對齊，並同步修復了 `maccha.html` 的編譯錯誤，最後成功將專案重新部屬至 Firebase Hosting。

## [2026-02-22T12:34:57.757928] Fix maccha layout and admin order IDs

### Summary of changes
- Completely refactored `maccha.html` layout structure to prevent Jekyll parser breaking on CSS inside YAML frontmatter.
- Restored `maccha.html` DOM container targets (`#status-grid-container`, `#product-list-container`) for JS interactions.
- Fixed `admin.html` order numbering UI where old Firebase orders showed "N/A".

### Technical details of implementation
- Moved `<style>` blocks explicitly out of `styles: |` frontmatter and natively injected them into `maccha.html` body to prevent Jekyll `SafeYAML` parse failures.
- Restored the required html sections in `maccha.html` which populate the JS loader targets.
- Updated `admin.html` rendering loop to check for explict `order.order_id !== 'N/A'` fallback conditions from legacy DB states.

### Affected files or modules
- `maccha.html`
- `admin.html`

### Chinese Summary
修復了 `maccha.html` 網頁破版與讀取失敗問題（將 CSS 樣式徹底移出 YAML 標頭以修復 Jekyll 編譯器異常），並補回前端渲染所需的 HTML 容器標籤。此外修復了管理後台訂單編號顯示為「N/A」的問題，已自動過濾資料庫舊有的 "N/A" 欄位並顯示正確的訂單唯一碼。

## [2026-02-22T13:45:00] Fixed Maccha Loader Error & API Restoration

### Summary of changes
- Resolved "Uncaught ReferenceError: db is not defined" in `maccha.html`.
- Restored and consolidated `js/api.js` to ensure legacy order tracking and new notification services work in harmony.
- Fixed a script path error in `jyoukyou.html`.

### Technical details of implementation
- **Firebase Initialization**: Re-inserted Firebase SDK (v9 compat) and Firestore initialization directly into `maccha.html` before the loader script.
- **API Consolidation**: Merged `js/api.js` from `git_backup` (containing `queryOrder` and GAS endpoints) with the newer `sendNotification` handler (using `FIREBASE_HANDLER` endpoint).
- **Project Structure**: Cleaned up `maccha.html` and `denwa.html` by moving CSS/JS out of YAML frontmatter to prevent Jekyll parsing errors.
- **Verification**: Verified deployment via browser tests, confirming product list loading and UI stability.

### Affected files or modules
- `maccha.html`: Added Firebase setup and refactored layout.
- `js/api.js`: Restored legacy methods and combined with notification logic.
- `jyoukyou.html`: Fixed leading space in script path.

### Chinese Summary
修復了 `maccha.html` 的 "db is not defined" 錯誤。重新整合了 `js/api.js`，同時保留舊有的訂單查詢功能與新的郵件通知機制。此外修復了 `jyoukyou.html` 的路徑錯誤，並全面優化了頁面結構以避免 Jekyll 編譯異常。

## [2026-02-22T14:15:00] Removed redundant loader in maccha.html

### Summary of changes
- Removed a static spinner in `maccha.html` that remained visible after the main preloader faded out.

### Technical details of implementation
- Deleted the `#status-loader` div. The page already provides sufficient loading feedback via the full-screen `#intro-loader`.

### Affected files or modules
- `maccha.html`

### Chinese Summary
移除了 `maccha.html` 中多餘的旋轉載入動畫，優化視覺體驗。

## [2026-02-22T15:30:00] Fixed Matcha Product Import Error in Admin Panel

### Summary of changes
- Resolved "Uncaught ReferenceError: showModal is not defined" when importing matcha products in `admin.html`.

### Technical details of implementation
- Replaced incorrect `showModal` function calls with the existing `openModal` function in `processImportData` and `executeImport`.
- This fix restores the ability for users to choose between "Overwrite" and "Append" modes during Excel import.

### Affected files or modules
- `admin.html`

### Chinese Summary
修復了管理後台匯入抹茶商品時的錯誤，將誤植的 `showModal` 修正為 `openModal`，恢復「覆蓋」與「並存」模式的選擇功能。

## [2026-02-22T15:35:00] Implemented Global Matcha Product Import/Export

### Summary of changes
- Added "Global Export" and "Global Import" buttons to the Matcha Brand Overview layer in `admin.html`.
- Implemented bulk processing logic to handle products across all brands in a single Excel file.

### Technical details of implementation
- **UI Enhancement**: Added a new action group in the Brand Overview header with file input for global Excel operations.
- **Global Export**: Fetches all brands and products, maps brand IDs to names, and generates a unified Excel sheet.
- **Global Import**: Supports "Global Overwrite" and "Global Append" modes. Auto-maps products back to their respective brands using the `brand_id` column.
- **Batch Processing**: Uses Firestore's `writeBatch` and processes data in chunks of 500 to comply with SDK limits.
- **Syntax Fix**: Corrected a missing catch block in the existing product import logic.

### Affected files or modules
- `admin.html`

### Chinese Summary
實作了管理後台的「全域抹茶商品匯出匯入」功能。現在可以在品牌總覽界面一次匯出所有品牌的商品至單一 Excel 檔，或透過 Excel 一次性更新/新增多品牌的商品資料，並支援 500 筆一組的批量寫入以優化效能。

## [2026-02-22T15:50:00] Fixed script path in jyoukyou.html

### Summary of changes
- Resolved "Unexpected token '<'" error in `jyoukyou.html` by fixing the broken script path.

### Technical details of implementation
- Removed a leading space in the Liquid template tag for `js/api.js`. This ensures the script is correctly resolved and loaded instead of falling back to a 404 HTML page.

### Affected files or modules
- `jyoukyou.html`

### Chinese Summary
修復了 `jyoukyou.html` 的腳本路徑錯誤，解決了導致功能失效的 SyntaxError。

## [2026-02-22T16:26:00] Migrated order tracking to direct Firestore queries

### Summary of changes
- Replaced legacy Google Apps Script API with direct Firebase Firestore queries in `jyoukyou.html`.
- Added support for cross-collection search (Matcha `orders` and Denwa `denwa_orders`).

### Technical details of implementation
- Integrated Firebase SDK (v9 compat) into `jyoukyou.html`.
- Implemented `Promise.all` to concurrently query multiple collections.
- Added phone number normalization to handle various input formats (e.g., stripping non-digits).
- Mapped Firestore document fields to existing UI rendering logic.

### Affected files or modules
- `jyoukyou.html`

### Chinese Summary
將訂單追蹤系統全面遷移至 Firebase Firestore 直接查詢，支援同時檢索抹茶訂單與電話代撥預約，並優化了手機號碼的正規化比對。

## [2026-02-22T17:45:00] Admin UI/UX Refinement & Firestore Security Fixes

### Summary of changes
- Implemented a comprehensive UI/UX responsive design across the Admin Panel and public storefront pages.
- Standardized action buttons to a maximum of 2 characters and enabled icon-only mode on mobile.
- Resolved Firestore `Missing or insufficient permissions` errors for order tracking.
- Enhanced order details display for a cleaner vertical list view.

### Technical details of implementation
- **Button Text Policy**: Shortened common button texts (e.g., "訂單管理" to "訂單", "重新整理" to "刷新") to 2 characters, while preserving specified exceptions ("快速結帳", "加入購物車", etc.).
- **Responsive CSS**: Injected `.btn-text` and `.tab-text` classes with `@media` rules to hide labels on mobile devices while resizing icons and padding for touch friendliness.
- **Firestore Rule Fix**: Modified `firestore.rules` for `orders` and `denwa_orders` to allow `list` queries with `.limit(20)` instead of requiring a specific phone filter, enabling lookups via Order ID.
- **Order Formatting**: Updated `renderResults` in `jyoukyou.html` to split multi-item order strings into distinct bulleted `div` elements for improved readability.
- **Site-wide Consistency**: Applied responsive button logic to `index.html`, `maccha.html`, `denwa.html`, `shop/index.html`, and `denwa-form.html`.

### Affected files or modules
- `admin.html`, `jyoukyou.html`, `firestore.rules`, `denwa-form.html`, `shop/index.html`, `index.html`, `denwa.html`, `maccha.html`.

### Chinese Summary
優化全站 UI/UX 響應式設計：將按鈕文字精簡至 2 字並在手機版自動隱藏僅顯示圖示，提升操作靈活性。同時修復了 Firestore 訂單查詢的權限錯誤，並將查單結果的品項改為垂直清單顯示，提升閱讀美感。

## [2026-02-22T11:15:00] Final UI Polish & Site-wide Iconification

### Summary of changes
- Completed the transition to icon-based responsive buttons across all public and administrative pages.
- Standardized modal footer buttons and final UI labels for 100% compliance with the 2-character limit.
- Verified and fixed "empty button" issues on mobile by adding necessary icons.

### Technical details of implementation
- **Iconification**: Added `Material Symbols` icons to buttons like "前往", "諮詢", "狀況", and "詳情" to ensure they remain functional when labels are hidden on mobile.
- **Label Shortening**: Further refined `admin.html` by shortening "儲存設定" to "儲存" and "去編輯" to "編輯".
- **Responsive Consistency**: Synchronized the `.btn-text` class usage across `index.html` and `shop/index.html` to match the admin panel behavior.

### Affected files or modules
- `admin.html`, `index.html`, `shop/index.html`.

### Chinese Summary
完成全站按鈕圖示化與文字精簡，確保手機版在隱藏文字後仍具備直觀的圖示引導。精簡了後台剩餘的長按鈕（如：儲存設定）並同步全站響應式類別定義。

## [2026-02-22T11:20:00] Admin Page Button Iconification (Option A)

### Summary of changes
- Implemented full iconification for functional buttons in the Matcha, Plans, Shipping, and Fast Checkout sections.
- Unified action button sizes to match the height and style of the "Refresh" button.

### Technical details of implementation
- **Iconification**: Removed text labels from "Export", "Import", and "Add" buttons across multiple administrative modules.
- **Enhanced UX**: Added `title` attributes to icon-only buttons for tooltips, ensuring clarity while maintaining a minimal design.
- **Consistent Sizing**: Ensured all top-level action buttons in cards use the same base `.btn` style for uniform height and alignment.

### Affected files or modules
- `admin.html`.

### Chinese Summary
完成管理後台功能按鈕（匯出、匯入、新增）的全圖示化調整，統一按鈕高度與刷新按鈕一致，提升介面整潔度。

## [2026-02-22T11:25:00] Responsive UI Fix: Non-wrapping Headers and Status Badges

### Summary of changes
- Fixed an issue where action buttons and status toggles would wrap to multiple lines on mobile devices.
- Prevented text wrapping for status badges like "待確認" and "啟用中".
- Maintained horizontal alignment for the top bar and card headers across all screen sizes.

### Technical details of implementation
- **CSS Override**: Forced `.card-header-flex` to maintain `flex-direction: row` on mobile via `!important`, overriding the previous column-stacking behavior.
- **No-Wrap Policy**: Added `white-space: nowrap` to `.status-badge` to prevent status text fragmentation.
- **Flexbox Optimization**: Removed `flex-wrap: wrap` from header containers and replaced with `flex-wrap: nowrap` to ensure action groups stay together.
- **UI Consistency**: Applied consistent horizontal layout to the "Shop Status Toggle" within the configuration modal.

### Affected files or modules
- `admin.html`.

### Chinese Summary
修復手機版按鈕與狀態標籤（如：待確認、啟用中）會換行的問題。透過強制標題列維持橫排並防止標籤文字斷行，確保在窄螢幕下介面依然整齊不走鐘。

## [2026-02-22T11:30:00] Table Layout Optimization: Column Widths and Text-Wrapping

### Summary of changes
- Fixed date and time wrapping in the reservation (Denwa) list.
- Optimized column spacing in the Order list to reduce the gap between 'Status' and 'Actions'.
- Improved table readability on mobile by prioritizing content expansion for primary columns.

### Technical details of implementation
- **No-Wrap Dates**: Applied `white-space: nowrap` to date and time containers in `loadDenwaOrders` to ensure vertical alignment.
- **Column Sizing**: Implemented a "shrink-wrap" technique using `width: 1px` and `white-space: nowrap` for secondary columns (Total, Status, Actions), allowing the primary columns (LINE name/Merchant) to naturally expand and push icons closer to status badges.
- **Consistent Cell Padding**: Maintained consistent padding and vertical alignment across all data tables.

### Affected files or modules
- `admin.html`.

### Chinese Summary
優化表格排版：解決預約日期與時間換行問題，並透過縮減次要欄位（如：金額、狀態、操作）的寬度，讓「狀態」與「操作按鈕」更靠攏，改善大螢幕與手機版的閱讀比例。

## [2026-02-22T11:35:00] Order List Layout Refinement: Balanced Spacing

### Summary of changes
- Re-allocated column widths for the Order List to ensure better visual balance.
- Fixed the excessive gap between 'Status' and 'Actions' by assigning appropriate fixed widths to trailing columns.
- Increased the visibility of the LINE name by allowing it more flexible horizontal space.

### Technical details of implementation
- **Fixed Width Assignment**: Set explicit pixel widths for 'Order ID' (110px), 'Total' (80px), 'Status' (90px), 'Date' (100px), and 'Actions' (80px) in `loadOrders`.
- **Flexible Content**: Allowed the 'LINE' column to expand and fill the remaining table width, pushing subsequent columns into a more compact and readable group.
- **Center Alignment**: Centered the 'Status' badge within its column for better vertical scanning.

### Affected files or modules
- `admin.html`.

### Chinese Summary
優化訂單列表排版：為編號、總計、狀態、日期等欄位分配固定寬度，並讓 LINE 名稱彈性佔用空間。此舉解決了狀態與操作按鈕間隔過遠的問題，讓整體視覺比例更均勻。

## [2026-02-22T11:45:00] Admin UI Refinement: Table Spacing and Field Reordering

### Summary of changes
- Corrected "Order ID" font weight and size for better legibility.
- Optimized table column distribution in "Order List" to eliminate excessive white space next to the LINE column.
- Reordered fields in the "Reservation Details" modal to improve operational workflow.

### Technical details of implementation
- **Typography**: Updated Order ID style to `0.85rem` and `#4b5563` to resolve the "too thin" visual issue.
- **Table Layout**: Switched to a dynamic spacing model for the Order table. Removed rigid pixel widths and implemented a relative spacing approach that groups Status, Date, and Actions more naturally.
- **Modal Logic**: Reorganized the HTML structure in `viewDenwaDetails`. Moved "Reservation Plan" above "Merchant Name" and placed "In-Japan Info" between "Number of People" and "Notes".

### Affected files or modules
- `admin.html`.

### Chinese Summary
優化後台細節：修正訂單編號字體過細問題，並重新分配訂單列表的欄位寬度，消除 LINE 名稱旁的過大間距。同步依照需求調整預約詳情的欄位順序，提升資訊閱讀的邏輯性。

## [2026-02-22T11:50:00] Order Table Spacing Fix: Natural Column Distribution

### Summary of changes
- Fixed the excessive gap between "LINE" and "Total" columns in the Order list.
- Improved "Order ID" typography to resolve the "too thin" visual issue.
- Standardized cell padding for better content breathing room.

### Technical details of implementation
- **Layout Optimization**: Removed artificial `width: 1px` constraints on the right-side columns, allowing the browser's default table algorithm (`table-layout: auto`) to distribute extra space more evenly or shrink the table to its content.
- **Typography**: Changed Order ID font from `monospace` to standard system text (`0.9rem`, `font-weight: 700`, `color: #334155`) to provide a bolder, more balanced appearance.
- **Padding Refinement**: Applied consistent `padding: 12px 15px` to all header and data cells to ensure uniform spacing between columns regardless of content length.

### Affected files or modules
- `admin.html`.

### Chinese Summary
修正訂單列表間距：透過移除強制壓縮寬度的設定，讓瀏覽器依內容長度自然分配欄位間距，消除了 LINE 旁邊的過大空隙。同時加粗編號字體並調整字級，解決字體過細的問題。

## [2026-02-22T11:55:00] Responsive Product List Fix: Two-line Header for Mobile

### Summary of changes
- Fixed horizontal overflow in the product list header on mobile devices.
- Removed the redundant word "商品" from the brand title to maximize space.
- Implemented a two-line layout for narrow screens: title and back button on the first line, action buttons on the second.

### Technical details of implementation
- **Title Shortening**: Modified `showProducts` JavaScript function to set the title to just the brand name (e.g., "中村藤吉" instead of "中村藤吉 商品").
- **Wrap Logic**: Re-enabled `flex-wrap: wrap` specifically for the `#productsLayerItems` header.
- **Dynamic Stacking**: Added the `card-header-flex` class to the container while allowing inline wrap styles to override global constraints where necessary, ensuring a smooth transition to a two-line layout on small screens.

### Affected files or modules
- `admin.html`.

### Chinese Summary
修復手機版商品列表標題換行問題：移除標題中冗餘的「商品」二字以節省空間，並允許操作按鈕在狹窄螢幕下自動換行至第二排（返回與標題保留在第一排），解決橫向跑版問題。

## [2026-02-22T12:05:00] Admin UI: Global Table Scroll and No-Wrap Optimization

### Summary of changes
- Enforced a "No-Wrap" policy across all administrative tables to prevent content distortion on mobile.
- Implemented consistent horizontal scrolling (sliders) for all data tables.
- Removed mobile-specific column hiding to ensure full data accessibility via scrolling.

### Technical details of implementation
- **CSS Enhancement**: Broadened the `.data-table` CSS rule to include `white-space: nowrap` and a forced `min-width: 800px` for all child tables. This ensures that even on narrow screens, the table maintains its structure and provides a horizontal scrollbar.
- **Structural Cleanup**: Wrapped the "Product List" (both normal and batch-edit modes) in the required `.data-table` scrollable container.
- **Responsiveness**: Replaced older "hide columns on mobile" logic with a unified "scroll to see more" approach, providing a better user experience for data-heavy administrative tasks.

### Affected files or modules
- `admin.html`.

### Chinese Summary
後台表格全面優化：強制所有表格內容「不換行」，並統一設定 800px 的最小寬度與水平滑桿。現在手機版不再隱藏特定欄位，而是可以透過左右滑動查看所有完整資料，確保操作體驗一致。

## [2026-02-22T12:10:00] Admin UI: Shipping Rules Table View

### Summary of changes
- Replaced the card-based "Shipping Rules" layout with a structured data table.
- Consistent with the new "No-Wrap" and horizontal scrolling table standards.
- Improved readability of shipping tiers and category filters.

### Technical details of implementation
- **Table Transformation**: Refactored `loadShippingRules` to output a `<table>` within a `.data-table` scrollable wrapper.
- **Data Formatting**:
    - Combined multi-tier shipping rules into a single, scan-able text column.
    - Added stylized pills for categories to differentiate them from the primary shipping method.
    - Replaced raw tracking URLs with a clean "Link" icon.
- **Layout Consistency**: Aligned the "Edit" actions to the right, matching the Order and Product list patterns.

### Affected files or modules
- `admin.html`.

### Chinese Summary
運費規則表格化：將原本的卡片佈局改為表格呈現，並依照新標準設定水平滑桿，提升資訊排版密度與操作一致性，方便快速瀏覽各項運送方式與階梯運費。

## [2026-02-23T18:45:00] Global Import Enhancement: Auto-Brand Creation & Smart ID Matching

### Summary of changes
- Modernized the Global Excel Import process to be more forgiving and automated.
- Supported automatic brand creation for new brands found in the Excel file.
- Enabled multi-field brand matching (ID or Name).

### Technical details of implementation
- **Brand Detection Logic**: Updated `executeGlobalImport` to pre-fetch all existing brands. It now attempts to match the target brand using the "Brand ID" column first, falling back to "Brand Name" if the ID is missing.
- **Auto-Provisioning**: If a brand (by ID or Name) does not exist in the database, the system now automatically creates a new brand document with default settings (`active`, `visible`, etc.) before importing its products.
- **Product ID Handling**: Maintained support for auto-generating Firestore IDs for new products while allowing updates to existing products via IDs.
- **Batch Processing**: Integrated brand creation into the existing Firestore atomicity chunks (500 ops per batch).

### Affected files or modules
- `admin.html`.

### Chinese Summary
優化全域匯入功能：現在支援自動識別品牌（透過 ID 或名稱），若偵測到 Excel 中有新品牌，系統會自動在資料庫建立品牌文件，不再需要預先手動新增品牌。商品 ID 也會自動產生，大幅簡化 Excel 編輯流程。

## [2026-02-23T18:50:00] Admin UI: Excel Column Locking Security

### Summary of changes
- Implemented "Read-only" column protection for system-critical fields in exported Excel files.
- Switched export engine from SheetJS to ExcelJS to support advanced spreadsheet features.

### Technical details of implementation
- **Engine Upgrade**: Added `ExcelJS` library via CDN to handle workbook generation with protection metadata.
- **Cell Protection**: 
    - Specifically targeted columns labeled with "(勿動)" (Brand ID and Product ID).
    - Set `protection: { locked: true }` for these columns while keeping other data fields unlocked.
    - Applied a light gray background fill (`FFF1F5F9`) to locked cells to provide a visual cue to the user.
- **Worksheet Security**: Enabled `sheet.protect()` with standard flags, allowing users to select and format cells but preventing modifications to the locked ID strings.
- **Compatibility**: Maintained `SheetJS` for the import logic due to its robust parsing capabilities, ensuring current workflows remain uninterrupted.

### Affected files or modules
- `admin.html`.

### Chinese Summary
Excel 安全優化：匯出的 Excel 檔案現在支援「欄位鎖定」功能。所有標註為「勿動」的 ID 欄位都會被自動鎖定並加上灰色底色，防止編輯過程意外改動系統關鍵 ID，確保資料匯入時的關聯性。

## [2026-02-23T20:30:00] Admin UI: Denwa Order Case Closure with Email Notification

### Summary of changes
- Added case closure ("結案") feature for phone reservation (denwa) orders in the admin panel.
- Implemented an email editor modal that pre-fills customer reservation data and allows full customization before sending.

### Technical details of implementation
- **GAS Handler**: Added `denwa_close_case` action to `firebase_handler.gs`. Front-end generates complete HTML for both customer and admin email versions; GAS only handles delivery via brand alias (`SENDER_ALIAS`).
- **Admin UI - Close Case Button**: Added `assignment_turned_in` icon button in the denwa orders table, next to the existing "Edit" button.
- **Email Editor Modal (`closeDenwaCase`)**: 
    - Editable subject, greeting, and outro sections with sensible defaults.
    - Dynamic table pre-filled with the customer's original reservation data (9 fields). Rows can be added, removed, or edited freely.
    - Optional notes field displayed with a branded border.
    - Two configurable CTA buttons (filled/outline styles) with toggle switches.
    - Fixed KEICHA brand footer/signature.
- **Dual Email Dispatch**: Customer email includes full content (greeting + table + notes + outro + buttons + signature). Admin email is a simplified version (order ID + table + signature).
- **Status Update**: After successful email dispatch, Firestore document status is updated to "已結案".
- **Badge Style**: Added `.completed` CSS class (blue theme) for the "已結案" status badge.

### Affected files or modules
- `admin.html` (UI + logic)
- `_site/gas/firebase_handler.gs` (email dispatch)

### Chinese Summary
新增「電話預約結案」功能：管理員可一鍵開啟結案信件編輯器，自動帶入客戶預約資料並可調整內容後發送。信件同時寄送客戶版（完整通知）與管理員版（簡化紀錄），發送後訂單狀態自動更新為「已結案」。

## [2026-02-23T21:15:00] Denwa Form: Fix Missing Data, Order ID, and Preview Bugs

### Summary of changes
- Fixed 3 critical data bugs in the denwa booking form.
- Updated admin badge colors to match existing project palette.

### Technical details of implementation
- **Missing `contact_in_japan`**: The `japanContact` form field was never mapped into the Firestore payload. Added `contact_in_japan: formData.get('japanContact')` to the save object. This was the root cause of "在日資訊" being lost.
- **Order ID Format**: Replaced raw Firestore document ID with a structured `DENWA-YYMMDD##` format (e.g., `DENWA-26022301`). Uses a prefix-based query to count existing orders for the day and auto-increment the sequence number.
- **Preview Table Fix**: `displayData` passed to `form-result.html` was missing explicit `shopName`, `bookingName`, `japanContact`, `phone`, and `note` mappings. Fixed all field names to match what `form-result.html` expects.
- **Async Flow**: Changed `submitForm()` to `async` to support `await`-based order ID generation.
- **Badge Colors**: Changed "已結案" badge from blue to brand green. Changed table row delete button from red to gray.

### Affected files or modules
- `denwa-form.html` (form submission logic)
- `admin.html` (badge CSS + delete button color)

### Chinese Summary
修復三個關鍵資料 Bug：1) 在日資訊欄位未存入資料庫；2) 訂單編號改為 DENWA-YYMMDD 流水號格式；3) 預覽表格未正確顯示預約商家與英文姓名。同時修正管理介面結案 badge 顏色與刪除按鈕色調。
## [2026-02-24T01:10:00] Advanced Admin Security & UI Polish

### Summary of changes
Implemented highly secure Admin authentication for GAS actions using Firebase ID Tokens and standardized UI status labels and color schemes.

### Technical details of implementation
- **ID Token Verification**: Updated `admin.html` to retrieve the current user's Firebase ID Token. Modified `gas/firebase_handler.gs` to verify this token against the Google Identity Toolkit API. Only the authorized administrator (`wj209ing@gmail.com`) can now trigger "Close Case" email notifications.
- **GAS Security (Public)**: Introduced `FIREBASE_API_KEY` storage via GAS ScriptProperties to enable back-end verification without hardcoding sensitive keys in source files.
- **Status Standardization**: Unified order status labels to: `待確認` (Pending), `已確認` (Confirmed), `已完成` (Completed), and `已取消` (Cancelled).
- **UI Logic Update**: Replaced all references to legacy "已結案" with "已完成". Updated badge colors to gray for all statuses except "已完成" (green).
- **Email Formatting**: Optimized the "Close Case" email generation to handle native newlines from textareas (replacing literal `\n`), and updated the default subject to "電話代撥結果通知".
- **API Extension**: Updated `js/api.js` to support optional `idToken` payload in `sendNotification`.

### Affected files or modules
- `admin.html`
- `js/api.js`
- `gas/firebase_handler.gs`
- `CHANGELOG.md`

### Chinese Summary
實作管理後台進階安全性防護：導入 Firebase ID Token 驗證機制，確保只有管理員登入後能觸發發信動作，並擋掉所有非法請求。同步統一了全站訂單狀態標籤與顏色（待確認/已確認/已完成/已取消），並優化結案信件的換行處理與預設主旨。

## [2026-02-24T01:15:00] Firebase App Check for Anti-Spam (Guest Protection)

### Summary of changes
Implemented Firebase App Check across all public-facing ordering pages to prevent automated bot spam and ensure all database writes originate from the official KEICHA website.

### Technical details of implementation
- **reCAPTCHA v3 Integration**: Integrated Firebase App Check SDK and activated it using the project's reCAPTCHA v3 Site Key (`6LcPa3UsAAAAAHJ-z9C3N9cqen3AYC8HxEQODoTM`).
- **Frontend Enforcement**: Updated `denwa-form.html`, `maccha-store.html`, `diy.html`, `fast.html`, and `shop/index.html` to include and initialize App Check.
- **Security Rules (Phase 3)**: Modified `firestore.rules` to enforce `request.app != null` for all public collection writes (`orders`, `denwa_orders`, `order_counters`, `members`). This blocks all requests that do not carry a valid App Check token.
- **Persistence**: Enabled auto-refresh for App Check tokens to ensure continuous protection for long-lived sessions.

### Affected files or modules
- `denwa-form.html`
- `maccha-store.html`
- `diy.html`
- `fast.html`
- `shop/index.html`
- `firestore.rules`
- `CHANGELOG.md`

### Chinese Summary
實裝 Firebase App Check 機器人防護機制：所有前台下單頁面（電話代撥、抹茶商店、自填單、快速結帳）現已整合 reCAPTCHA v3 驗證。同步更新 Firestore 安全規則，強制要求所有訂單寫入必須來自經過驗證的官方網頁，有效杜絕惡意自動化灌單。

## [2026-02-24] - Admin UX Polish & Auto-save Draft Persistence

### Summary of changes
Optimized the Admin Panel interaction flow by ensuring modals close immediately upon action and implemented a site-wide auto-save draft system for customer-facing forms to prevent data loss.

### Technical details of implementation
- **Admin Modal Logic**: Updated all delete functions (`deleteOrder`, `deleteDenwa`, `deleteProduct`, `deletePlan`, `deleteShipping`) to trigger `closeModal()` **before** the success alert. This provides immediate visual feedback and prevents duplicate deletion attempts.
- **Auto-save Drafts**: Implemented `localStorage` persistence across all "filling" type pages:
    - `denwa-form.html`: Real-time tracking for reservation and contact data.
    - `diy.html`: Persistent draft for custom order details and logistics selection.
    - `jyoukyou.html`: Remembers the last searched order ID or phone number for quick lookups.
- **Data Lifecycle**: Integrated `input` event listeners for real-time saving and `window.load` handlers for restoration. All drafts are automatically cleared from `localStorage` upon successful form submission.

### Affected files or modules
- `admin.html`: Re-ordered modal closure logic.
- `denwa-form.html`, `diy.html`, `jyoukyou.html`: Added draft save/load/clear logic.
- `maccha-store.html`: Fixed shipping fee calculation error caused by keyword mismatch (郵寄/宅配 vs 宅配到府) and added category filtering to prevent cross-page rule contamination.

### Chinese Summary
優化管理後台操作體驗：刪除按鈕現在會即時關閉彈跳視窗。為全站主要表單導入「自動草稿保存」功能。並修復了抹茶商店「宅配運費」顯示錯誤的問題，透過加強關鍵字模糊匹配與新增頁面分類過濾，確保運費規則抓取精準無誤。

## [2026-02-24] - Card Order System & Admin Link Management

### Summary of changes
Implemented a dedicated credit card ordering system with unique link suffixes, dynamic product rendering, and secure backend payment generation.

### Technical details of implementation
- **Custom Card Order Page**: Created `card-order.html` which uses the `id` URL parameter to fetch product details (title, description, amount, status) from Firestore.
- **Admin Link Management**: Added a "信用卡連結" tab to `admin.html` offering full CRUD capabilities for payment links.
- **Image Handling**: Integrated a Base64 image upload/preview system for product images, stored directly in the Firestore link document.
- **Suffix Generation**: Implemented a 4-digit unique suffix generator (e.g., `card-order.html?id=8821`) for clean sharing.
- **Multi-Stage Payments**: Added optional configuration for multi-stage payment descriptions.
- **GAS Payment Backend**: Updated `gas/firebase_handler.gs` with the `generate_card_payment` action. It verifies the link data in Firestore (to prevent price tampering) and generates a signed ECPay auto-submit form.
- **Security Rules**: Updated `firestore.rules` to allow public read access for the `card_orders_links` collection while restricted to authorized administrators for writes.

### Affected files or modules
- `card-order.html` [NEW]: Customer-facing payment page.
- `admin.html`: Added link management UI and logic.
- `gas/firebase_handler.gs`: Added payment generation and Firestore REST lookup logic.
- `firestore.rules`: Updated for the new collection.

### Chinese Summary
實作了專屬的「信用卡支付連結」系統。管理員可在後台建立帶有 4 位數唯一後綴的連結（如：8821），並自訂金額、標題與產品圖片（支援 Base64 直接儲存）。後端同步新增了安全的金流簽章產生邏輯，有效防止前端篡改金額，並支援綠界支付自動跳轉。

## [2026-02-24] - Custom Order ID Format (CYYMMDDXX)

### Summary of changes
Implemented a custom order ID format `CYYMMDDXX` (e.g., `C26022401`) for the card order system, replacing the generic `KC` + timestamp format.

### Technical details of implementation
- **Daily Sequential Counter**: Implemented `getNextOrderNumber` in `firebase_handler.gs` that uses a Firestore collection `order_counters` to maintain a daily sequence.
- **Auto-Reset**: The sequential number (01-99) automatically resets to 01 at the start of each day based on the `YYMMDD` prefix.
- **REST API Helpers**: Added `getFirestoreDocumentById` to securely retrieve counter data via Firestore REST API.
- **Integration**: Updated `handleCardPayment` to use the generated ID for both Firestore documents and ECPay `MerchantTradeNo`.

### Affected files or modules
- `gas/firebase_handler.gs`: Logic for ID generation and Firestore counter management.

### Chinese Summary
實作自定義訂單編號格式 `CYYMMDDXX`（如：`C26022401`），透過 Firestore `order_counters` 集合實作每日自動重置的流水號功能。

## [2026-02-24] - Card Order UI Refinement & Multi-Payment Support

### Summary of changes
Refined the card order checkout UI for better UX, added multi-payment method management (Credit Card & ATM), and implemented automated payment status tracking via Google Apps Script (GAS) callbacks.

### Technical details of implementation
- **UI Reordering**: Moved "Recipient Information" above "Shipping Section" in `card-order.html` for a more natural flow.
- **Visual Polish**: Removed borders from logistics option labels and optimized radio button styling.
- **Multi-Payment Support**: 
    - Added "Credit Card" and "ATM" checkboxes to the payment link modal in `admin.html`.
    - Updated `card-order.html` to render payment method selection dynamically.
- **Automated Status Tracking**:
    - Updated `firebase_handler.gs` to use the GAS Web App URL as the ECPay `ReturnURL`.
    - Implemented `handleECPayCallback` with CheckMacValue verification and automated Firestore status updates (`card_orders` collection).
    - Updated `firestore.rules` to permit order creation and status updates.

### Affected files or modules
- `card-order.html`: UI rearrangement and multi-payment rendering.
- `admin.html`: Managed payment method selection in the admin link modal.
- `gas/firebase_handler.gs`: Added payment callback logic and Firestore REST helpers.
- `firestore.rules`: Updated permissions for the `card_orders` collection.

### Chinese Summary
優化信用卡結帳頁面 UI（將收件資訊上移並美化外框），新增「信用卡/ATM」複選功能，並透過 GAS 實作綠界付款回傳自動更新訂單狀態的功能。

## [2026-02-24] - Refined Shipping Logic & Automated Stage Management
- **Advanced Shipping Rules**: Implemented "Free Shipping", "Uniform Fee", and "Individual Logistics Fees" logic in `admin.html` and `card-order.html`.
- **Automated Stage Status**: Integrated callback logic in `gas/firebase_handler.gs` to automatically mark payment stages as `is_paid` upon successful ECPay transaction.
- **Admin UI Consolidation**: Merged "Link Orders" management into the "Credit Card" tab and refined the visual style of settings by removing yellow backgrounds.
- **Table Unification & Optimization**: Standardized table styles and components (badges, padding) across all order modules. Added a search filter and stage count display for easier link management.
- **Improved Data Handling**: Enhanced Firestore REST API parsing for complex nested arrays and objects in GAS.

**實作了進階運費邏輯與支付階段自動化，並完成管理後台介面整併、樣式統一與搜尋優化。**

[admin.html](file:///Users/jing/Downloads/keicha2025.github.io/admin.html), [card-order.html](file:///Users/jing/Downloads/keicha2025.github.io/card-order.html), [gas/firebase_handler.gs](file:///Users/jing/Downloads/keicha2025.github.io/gas/firebase_handler.gs)
- **Advanced Shipping Logic**: 
    - Updated `admin.html` to support "Free Shipping", "Uniform Fee", and "Individual Logistics Fees" (7-11, FamilyMart, Home) per payment link.
    - Implemented `toggleLinkFeeInputs` in the admin modal to manage reactive UI states.
    - Updated `card-order.html` to dynamically calculate totals and display shipping options based on link-specific rules.
- **Automated Stage Status**:
    - Enhanced `gas/firebase_handler.gs` to automatically mark specific payment stages as `is_paid: true` within the `card_orders_links` collection upon receiving a successful ECPay callback.
    - Improved `fetchFirestoreDocument` in GAS to correctly parse and reconstruct nested/array data from the Firestore REST API.
    - Added `updateFirestoreDocumentWithArray` to support partial updates of complex array fields in Firestore.
- **Frontend Enforcement**:
    - Payment stages already marked as "Paid" are now disabled and visually struck out in `card-order.html` to prevent duplicate payments.

### Affected files or modules
- `admin.html`: Updated link modal and saving logic.
- `card-order.html`: Updated checkout logic and stage rendering.
- `gas/firebase_handler.gs`: Updated callback logic and Firestore helper functions.

### Chinese Summary
優化了專屬支付連結的運費邏輯，對齊「快速結帳」系統提供免運、統一運費或個別物流計費選項。同步實作了階段付款自動化：當訂單支付成功後，系統會自動將連結中的對應階段標記為「已付」，且前台會自動停用已支付的項目避免重複扣款。

## [2026-02-25] - Shipping & Amount Logic Refinement
### Admin & Checkout Optimization
- **Admin Modal Refinement**:
    - Renamed "Total Amount" to "Product Amount (Excluding Shipping)" to clarify input requirements.
    - Reordered shipping settings: "Shipping Methods" selection now precedes fee configuration.
    - Implemented conditional fee inputs: Individual fee fields are now disabled and dimmed if the corresponding method is not selected.
    - Added automated total calculation preview that sums product amount and the highest selected shipping fee.
    - Standardized shipping methods to "7-11", "全家" (FamilyMart), and "宅配" (Home Delivery), removing the "N/A" option.
    - Integrated convenience lookup links for 7-11 and FamilyMart store maps in both admin and checkout views.
- **Affected Files**: `admin.html`, `card-order.html`

**中文摘要：優化運費與金額邏輯。管理端更名為「商品金額」並新增總額預算；運送方式移至上方並與費率輸入框聯動；同步全站三種運送方式並加入門市查詢連結。**

## [2026-02-25T11:45:00] - Admin Table Alignment & Checkout Logistics Overhaul
### UI Unification and Premium Redesign
- **Admin Panel Alignment**:
    - Standardized the 'Link Orders' table in `admin.html` to match the main 'Orders' table styling (padding, typography, and structure).
    - Replaced the generic table header with standard columns: "編號", "收件人", "本次金額", "狀態", "日期", "操作".
    - Implemented a complete set of action buttons (Info, Edit, Delete) for link orders with identical styling and functionally consistent modals.
    - Refined amount and status displays to align with the primary order list's color palette and fonts.
- **Checkout Page Overhaul (`card-order.html`)**:
    - Replaced the dynamic logistics section with the premium, card-based HTML structure from `fast.html`.
    - Integrated 7-11 and FamilyMart store lookup functionality with `.btn-outline-green` styling (removing default blue).
    - Updated `selectLogistics()` and `renderPage()` logic to support the new card-toggling interaction and detail section visibility.
    - Fixed data mapping in `submitOrder()` to correctly retrieve store IDs and addresses from the new card-based inputs.
- **Affected Files**: `admin.html`, `card-order.html`

**中文摘要：同步管理後台「連結訂單」與主訂單列表的表格樣式與操作功能（新增詳情、編輯、刪除）。全面重構 `card-order.html` 運送方式區塊為與 `fast.html` 一致的高級卡片式設計，整合店號查詢並修正按鈕樣式。**

---

## [2026-02-25T13:50:00] - Admin Logistics Load Logic & Data Stability Fix
### Summary of changes
Refactored the internal loading mechanism for global shipping methods to ensure data availability across all admin modules and fixed UI synchronization issues.

### Technical details of implementation
- **Singleton Fetching Pattern**: Implemented `ensureGlobalMethods(forceRefresh)` which centralizes Firestore access. It uses a semaphore-like flag (`isFetchingGlobalMethods`) to prevent redundant simultaneous requests and ensures a single source of truth for the `globalShippingMethods` array.
- **Asynchronous Modal Pre-loading**: Modified `showCardLinkModal`, `showShippingModal`, `editShipping`, and `loadFastConfig` to `await` the completion of `ensureGlobalMethods()` before constructing the HTML. This guarantees that multi-select checkboxes and dropdowns are always populated with live data even if accessed immediately after login.
- **Data-UI Decoupling**: Refactored `loadGlobalMethods()` to focus on rendering, decoupled from the fetching state, allowing it to be safely called from any tab without DOM dependencies.
- **Smart Refresh Mechanism**: Added `forceRefresh` support to allow `saveGlobalMethod` and `deleteGlobalMethod` to invalidate the local cache and trigger an immediate database sync, keeping the admin UI perfectly synchronized with Firestore.
- **Default State Correction**: Updated new card link creation template to default to an empty shipping method list, forcing accurate selection based on current logistics settings.

### Affected files or modules
- `admin.html`: Significant refactoring of shipping method logic and modal initialization.

### Chinese Summary
重構管理後台物流管道載入機制：導入 `ensureGlobalMethods` 單例抓取策略，解決「新增支付連結」與「運費規則」彈窗偶爾出現物流選項空白的問題。確保數據抓取與介面渲染分離，並在更新物流管道後即時強制同步全站快取，提升系統穩定性。

---

## [2026-02-25T14:15:00] - Card Link Management Amount Label Clarification
### Summary of changes
Standardized the terminology for product costs and final totals within the Card Link Management module to better distinguish between fixed product prices and dynamic total payable amounts.

### Technical details of implementation
- **Table Header Update**: Changed "總金額" to "商品金額" in the `loadCardLinks` table to accurately reflect that this value represents the base product price without shipping.
- **Modal UI Refinement**: 
    - Renamed "商品金額 (不含運)" to simply "商品金額" in the Card Link creation/edit modal.
    - Updated the real-time calculation preview label from "預估應付總額" to "本次應付金額" to emphasize that this is the final amount the customer will pay (including selected shipping fees).
- **Consistent Terminology**: Synchronized the `updateLinkTotalView` function to ensure all dynamic price updates use the new "本次應付金額" label.

### Affected files or modules
- `admin.html`: Modified `loadCardLinks`, `showCardLinkModal`, and `updateLinkTotalView`.

### Chinese Summary
優化「刷卡連結管理」金額標示：將列表標題與編輯視窗中的「總金額」明確更名為「商品金額」，並將計算運費後的加總項標示為「本次應付金額」。此更動旨在區分固定商品單價與最終含運費的結帳金額，減少管理端的認知誤差。

---

## [2026-02-25T14:15:00] - Client-Side UI Premium Refinement & Logic Fix
### Summary of changes
Polished the student-facing checkout pages to separate product costs from shipping fees and enhanced the UI by removing heavy borders for a cleaner, more premium aesthetic.

### Technical details of implementation
- **Amount Separation**:
    - In `card-order.html`, Modified `updateTotal()` to ensure the "商品金額" label strictly displays the product/stage base price without including the dynamically calculated shipping fee. The shipping fee is now exclusively factored into the final "本次應付金額" total.
- **UI Aesthetic Enhancement (Border Removal)**:
    - **Payment & Stage Options**: Removed standard gray borders (`border-gray-100`) from interactive radio labels. Replaced with subtle background colors (`bg-gray-50`) and improved hover states.
    - **Logistics Cards**: Refactored `.logistics-card` CSS across `card-order.html`, `fast.html`, and `maccha-store.html`. Replaced the thick gray borders with a transparent border/subtle background combo, transitioning to a brand-green border only when actively selected.
    - **Color Synchronization**: Adjusted background and icon container colors to use lighter, semi-transparent brand tones (`brandLight/50`) for a softer visual hierarchy.

### Affected files or modules
- `card-order.html`: Logic fix for amount display and UI styling.
- `fast.html`: Logistics card UI refinement.
- `maccha-store.html`: Logistics card UI refinement.

### Chinese Summary
優化客戶端結帳介面：修正「商品金額」顯示邏輯，確保其固定顯示商品原價（不含運費），運費僅計入最終結帳總額。同步進行 UI 質感升級，移除付款方式與物流卡片的灰色邊框，改採淺色背景與品牌色動態邊框，營造更輕盈、高品質的視覺體驗。

---

## [2026-02-25T15:15:00] - Order Logic & UI Enhancements
### Summary of changes
Fixed permission issues in `fast.html`, upgraded the order success page, and added robust shipping validation to `card-order.html`. Enhanced the order tracking page with "Go to Payment" functionality for card orders.

### Technical details of implementation
- **Permission Fix**: Added `source_token` to Firestore writes in `fast.html` and `denwa-form.html` to resolve authorization errors.
- **Premium Success Page**: Rebuilt `fast-diy-result.html` to match the high-end design of `form-result.html`, including order detail tables and screenshot reminders.
- **Strict Shipping Validation**: Implemented input checks in `card-order.html`:
    - CVS: Requires exact 6-digit store code.
    - Home Delivery: Requires a non-empty, minimum length address.
- **Order Tracking Upgrades**: Modified `jyoukyou.html` to:
    - Search across `card_orders` collection.
    - Dynamically display a "Go to Payment" (前往付款) button for unpaid card and telephone orders.

### Chinese Summary
修復 `fast.html` 下單權限錯誤，並升級結帳成功頁面至精品規格。同步加強專屬支付連結的物流校驗（超商 6 碼、宅配地址），並在訂單查詢頁面針對未付款訂單新增「前往付款」按鈕，優化支付閉環。

---

## [2026-02-25T15:53:00] - Admin Image Upload Optimization
### Summary of changes
Enhanced the image upload functionality in the admin backend for card payment links. This includes logic updates for better image quality and a UI overhaul of the upload component.

### Technical details of implementation
- **Center-Crop Compression**: Updated `previewLinkImage` in `admin.html` to use a Canvas-based central cropping algorithm. Images are now automatically cropped and resized to a perfect `1080x1080` square resolution.
- **Custom UI Components**: Replaced the native browser "Choose File" input with a custom-styled dotted-border button featuring a cloud upload icon, aligning with the project's premium aesthetic.
- **UX Improvements**: Added informative text within the upload area to guide users towards uploading 1080x1080 images for optimal results.

### Affected files or modules
- `admin.html`: CSS styles, HTML structure, and JavaScript compression logic.

### Chinese Summary
優化管理後台支付連結的縮圖上傳功能：將自動壓縮規格提升至 `1080x1080` 並改為正方形「中心裁切」，確保縮圖質感與比例統一。同時美化上傳介面，將原生檔案選擇器替換為品牌風格的自定義虛線按鈕。

---

## [2026-02-25T15:58:00] - Admin Link Defaults Synchronization
### Summary of changes
Improved the user experience for creating new payment links by automatically synchronizing default settings with the main store configuration.

### Technical details of implementation
- **Config Sync**: Updated `showCardLinkModal` in `admin.html` to fetch the latest settings from the `fast_checkout_config/default` document when initializing a new link.
- **Auto-Population**: For new links, the following fields are now pre-populated from the store defaults:
    - Enabled shipping methods (7-11, FamilyMart, Home Delivery).
    - Free shipping status.
    - Uniform fee settings and specific shipping fees for each method.

### Affected files or modules
- `admin.html`: Initialization logic for the payment link creation modal.

### Chinese Summary
優化支付連結的新增體驗：新增連結時會自動讀取資料庫中的「快速結帳設定」作為預設值，包括預設啟用的物流方式、免運設定及各項運費金額，提升管理效率。

---

## [2026-02-25T16:03:00] - Admin UI & Logic Refinement
### Summary of changes
Polished the admin interface by removing unauthorized red accents and fixing logic errors in the payment link configuration.

### Technical details of implementation
- **UI Standard Compliance**: Removed red color (`#ef4444`) from all `delete` icons and replaced them with a neutral gray (`#64748b`) to maintain the brand's premium and cohesive aesthetic.
- **Nullish Logic Fix**: Refactored the data initialization in `showCardLinkModal` to use the nullish coalescing operator (`??`). This ensures that shipping fees set to `0` in the database are correctly respected and not overwritten by hardcoded fallback values like `60` or `120`.
- **Template Cleanup**: Removed hardcoded fallback values from the HTML template string for shipping fees, allowing values to flow directly from the database configuration.

### Affected files or modules
- `admin.html`: Icon styling and modal initialization JavaScript.

### Chinese Summary
優化後台視覺與邏輯細節：全面移除刪除圖示的紅色樣式，改為中性深灰色以符合品牌質感；同時修正運費初始化邏輯，確保資料庫中設定為 0 元的項目不會被預設的 60/120 元覆蓋，精準呈現金流設定。

---

## [2026-02-25T16:15:00] - Multi-stage Checkout & Admin Shipping Logic Fix
### Summary of changes
Refined the multi-stage payment experience in the card checkout page and enhanced the admin panel's shipping configuration logic to pull live data from the database.

### Technical details of implementation
- **Multi-stage Payment UI**:
    - Updated `card-order.html` to clearly separate "Product Total" and "Order Total (incl. Shipping)" in the summary area from the "Amount Due Now" (current stage) in the payment bar.
    - Standardized the hover effect for payment stages using a brand-aligned light green (`#f9fdf7`) and dynamic border (`#6ea44c`) instead of the default Tailwind green.
    - Ensured consistent use of `font-mono` for all currency displays.
- **Admin Shipping Synchronization**:
    - Added a live fetch of `shipping_rules` collection within the `showCardLinkModal` workflow in `admin.html`.
    - Implemented auto-population logic: when selecting a shipping method (e.g., 7-11), the system now pulls relevant base fees from `shipping_rules` and automatically fills the fee inputs if they are empty or set to zero.

### Affected files or modules
- `card-order.html`: UI layout and `updateTotal` JavaScript.
- `admin.html`: Modal initialization and shipping fee toggle logic.

### Chinese Summary
優化分階段支付體驗與後台物流配對邏輯：分派結帳頁現在會同時顯示「商品總額」與「訂單總額」，並於支付列標註「本次應付金額（階段款項）」。後台新增支付連結時，勾選物流方式將自動從 `shipping_rules` 資料庫抓取對應運費預填，減少人工輸入誤差。

---

## [2026-02-25T16:25:00] - Admin Auto-calculating Payment Stages
### Summary of changes
Introduced smart calculation for payment stages in the admin panel, allowing administrators to manage multi-stage payments more efficiently without manual math.

### Technical details of implementation
- **Auto-Balance Calculation**: Added `calculateRemainingStage` logic in `admin.html`. When multiple stages are present, editing the amount of any early stage (e.g., Down Payment) now automatically calculates and updates the final stage (e.g., Final Payment) to ensure the total matches the primary product amount.
- **Smart Row Addition**: Updated `addStageRow` to automatically label rows as "預付款" (Down Payment) for the first entry and "尾款" (Final Payment) for subsequent entries.
- **Improved UX**: Redesigned the "Stages" section in the admin modal with a more subtle, professional UI featuring dashed borders and clear descriptive text. Added live input listeners to ensure balance updates happen in real-time.

### Affected files or modules
- `admin.html`: Modal structure and stage management JavaScript.

### Chinese Summary
後台分階段支付智慧化：現在新增支付階段時，系統會自動將第一項標記為「預付款」，其餘為「尾款」。管理者只需輸入預付款金額，系統便會根據商品總額自動計算並填入尾款金額，無需再手動拆分與對帳。

---

## [2026-02-25T16:35:00] - Admin Payment Stages Simplification
### Summary of changes
Streamlined the multi-stage payment configuration in the admin panel to focus on a single input for Down Payment, removing the need for manual stage management.

### Technical details of implementation
- **Simplified Workflow**: Replaced the interactive "Add Stage" list with a single "First Stage Down Payment" toggle and number input field.
- **Auto-Logic Integration**: 
    - Updated `saveCardLink` in `admin.html` to automatically generate a two-stage payment structure (Down Payment + Final Payment) whenever the down payment option is enabled.
    - Added validation to ensure the down payment is a positive value less than the total product amount.
- **UI Decoupling**: Removed all JavaScript functions related to dynamic stage row management (`addStageRow`, `calculateRemainingStage`) to reduce code complexity and potential UI errors.
- **Data Persistence**: Ensured existing multi-stage links correctly populate the new simplified input field upon editing.

### Affected files or modules
- `admin.html`: Modal structure, input logic, and save process.

### Chinese Summary
後台分階段支付大幅簡化：移除複雜的「增加階段」清單，改為單一「第一階段預付款」輸入框。現在管理者只需輸入預付款金額，系統在儲存時會自動推算出尾款並生成完整的兩階段支付結構，大幅提升操作效率。

---

## [2026-02-25T16:45:00] - Enforced Multi-stage Payment Logic
### Summary of changes
Refined the multi-stage payment system with enforced sequential payment logic and a simplified administrative configuration.

### Technical details of implementation
- **Admin Optimization**: Simplified the payment stage UI in `admin.html`. Administrators now only need to enable "First Stage Down Payment" and enter an amount. The system automatically calculates and generates the "Final Payment" stage upon saving.
- **Sequential Payment Enforcement**: Modified `card-order.html` to prevent users from paying the final installment before the down payment is received. The "Final Payment" radio option is locked and visually disabled until the first stage is marked as `is_paid`.
- **Flexible Full Payment Option**: Added an "One-time Full Payment" option to the checkout page, available only before any installments have been paid. 
- **Shipping Fee Logic Refinement**: Updated `updateTotal` and `submitOrder` to ensure that **shipping fees are only applied to the Final Payment stage or Full Payment**. Selecting the "Down Payment" stage will now automatically set the shipping fee to 0.
- **Backend Validation (GAS)**: Updated `handleCardPayment` in Google Apps Script to verify the stage sequence server-side and enforce zero shipping fees for the first stage.
- **Automatic Status Synchronization**: Enhanced the ECPay callback handler to update stage statuses in Firestore. When a full payment is made, all corresponding stages are automatically marked as paid.
- **Security Enhancements**: Patched a critical vulnerability in `firestore.rules` by removing frontend write access to the `card_orders` and `order_counters` collections. Order creation is now strictly regulated via a hard-coded client token, and modifications are restricted to admins or backend processes, preventing injection or unauthorized deletion.
- **UX & Anti-Double-Submit**: Added a full-screen loading overlay (`#loading-overlay`) during the payment submission process in `card-order.html` to prevent users from interacting with the page while the API request is pending, mitigating the risk of double submissions.

- **Go-live Audit & Quality Assurance**:
    - **Idempotency Implementation**: Introduced `request_id` on the frontend and backend to prevent duplicate order generation from network retries or double-clicks.
    - **Visual Consistency (8pt Grid)**: Adjusted `.section-card` spacing (mobile optimize) and unified button corner radius to `16px` (2xl) to match premium input styles.
    - **Advanced UX Transitions**: Added smooth CSS transitions for logistics detail expansion in `card-order.html`, replacing abrupt visibility toggles.
    - **Admin Mobile Optimization**: Refactored the "Close Case" modal table to support responsive wrapping, ensuring usability on small screens.
    - **Empathetic Empty States**: Standardized "Empty State" UI across all admin panels with icons and contextual messaging to reduce coordinator uncertainty.
    - **Error Resilience**: Enhanced API error handling in admin panels with user-friendly retry states for better fault tolerance.

- **Admin UI Refinement**:
    - **Tab Renaming**: Simplified "刷卡管理" to "刷卡" for a cleaner header.
    - **Typography Adjustment**: Removed italic style from order notes in the card order table for better legibility.
    - **Financial Transparency**:
        - Added a "Total Amount" (總金額) column to the card order table with a gray sub-label for shipping fees.
        - Enhanced the Order Detail modal to explicitly break down financial components: "Product Amount" (商品金額), "Shipping Fee" (運費), "Total Budget" (總預算), and "Current Stage Amount" (本階段金額).
    - **Consistency**: Unified refresh buttons across admin panels using standard `.btn-secondary` styling with icons.

### Affected files or modules
- `admin.html`: Tab labels, order table structure, financial breakdown in detail modals, and UI consistency tweaks.

### Chinese Summary
優化管理員介面：簡化標籤名稱，並在刷卡訂單列表中加入「總金額」與「運費」標示。詳情視窗現在會清晰拆解商品原價、運費及目前支付階段的金額結構，提升帳務核對的透明度與便利性。

- **Order Status Page Refinement (`jyoukyou.html`)**:
    - **Financial Breakdown**: Enhanced search results to display a detailed breakdown of costs, including "Product Amount" (商品金額), "Shipping Fee" (運費), and "Total Amount" (總計金額) when available.
    - **Stage Payment Clarity**: Specifically labeled "Current Stage Payment" (本階段支付) for card orders to prevent user confusion during multi-stage billing.
    - **Layout Breathability**: Significant spacing improvements:
        - Added `pt-12` and `mt-8` to the primary search container to ensure proper separation from the site navigation/header.
        - Increased vertical spacing between the Search Box, Results Section, and "Need Help" container to improve visual hierarchy.

### Affected files or modules
- `jyoukyou.html`: Detailed financial results rendering and container spacing adjustments.

### Chinese Summary
優化訂單查詢頁面：在查詢結果中加入詳細的金額拆解（商品原價、運費、總額），並針對信用卡分期訂單標示「本階段支付」，讓使用者清楚掌握扣款細節。同時加大了頁面區塊間的間距，提升整體閱讀呼吸感。



---

## [2026-02-27] - Linear Order Detail Page Templates

### Summary of changes
Created two distinct design templates for the new Order Detail Page to evaluate different user experiences and information hierarchies. Both templates are built using the project's centralized design tokens to ensure visual consistency and a premium aesthetic.

### Technical details of implementation
- **Directory Establishment**: Created `/demo` folder to serve as the prototyping environment for new UI components.
- **Version A (Vertical Linear)**: 
    - Implemented a "Story-telling" timeline using vertical CSS pseudo-elements.
    - Focused on mobile-first accessibility where status updates flow naturally downwards.
    - Used brand-light (#ebf1e9) for active node backgrounds and brand-green (#6ea44c) for the primary track.
- **Version B (Horizontal Stepper)**:
    - Designed a "Status-at-a-glance" header with a horizontal progress stepper using SVG-like linear structures.
    - Implemented a 3-column layout (on desktop) for better information density, separating items, financial summaries, and shipping data.
- **Design System Adherence**: 
    - **Radius**: Applied `var(--r-lg)` (24px) for cards and `var(--r-md)` (16px) for inputs/buttons.
    - **Color**: Strictly used brand green variations and ghost backgrounds from `DESIGN_SYSTEM.md`.
    - **Typography**: Integrated `Zen Maru Gothic` for branding and `Noto Sans TC` for body content.
- **Responsive Engineering**: Utilized Tailwind CSS for fluid layout transitions between mobile and desktop views.

### Affected files or modules
- `demo/version-a.html` [NEW]
- `demo/version-b.html` [NEW]

### Chinese Summary
建立與優化訂單詳情頁面範本：在 `demo/` 資料夾下實作兩款風格原型。版本 A 採用「縱向線性軌跡」，版本 B 採用「橫向步進器」。並針對版本 A 進行了 UI 精鍊，包含移除狀態標籤、更新狀態進階邏輯及新增聯絡客服按鈕。

- **Refined Version A**:
    - Removed redundant status badges from the header for a cleaner aesthetic.
    - Updated timeline logic to a 3-stage progression: Submitted (Gray), Confirmed (Brand Green), Completed (Brand Green).
    - Integrated a "Contact Support" call-to-action button using the primary brand style, adjusted to full-width to align with main content containers.

## [2026-02-28] - Denwa Pay Page Design Prototypes

### Summary of changes
Created two distinct design prototypes for the upcoming "Phone Service Payment" page to validate the user experience and visual layout before integrating dynamic database synchronization.

### Technical details of implementation
- **Template V1 (Vertical Detail List)**:
    - Designed as a full-width card containing a vertical list of plans.
    - Each plan item features a title, subtle description, and side-aligned price/button groups.
    - Optimized for scenarios with extensive plan descriptions.
- **Template V2 (Compact Grid Cards)**:
    - Designed with a 2-column grid layout within the main card.
    - Emphasizes price through the `Zen Maru Gothic` brand font.
    - Includes a high-contrast dark manual payment entry button for visual separation.
- **Design System Integration**: 
    - Both prototypes are built on the KEICHA design engine (24px radius, 8pt spacing).
    - Integrated `animate-fade-up` and standardized brand terminology.
    - Preserved the fixed "Manual Payment" requirement for `https://pcpay.tw/NF4vv`.

### Affected files or modules
- `demo/denwa-pay-v1.html` [NEW]: Vertical list prototype.
- `demo/denwa-pay-v2.html` [NEW]: Grid card prototype.

### Chinese Summary
建立了「電話代撥支付頁」的兩款視覺原型：版本 V1 為「縱向清單」，適合詳細說明；版本 V2 為「兩欄網格」，強調金額展示。兩者皆嚴格遵守品牌設計規範，提供初步選型依據。

## [2026-02-28] - Official Denwa Pay Page Implementation

### Summary of changes
Completed the official implementation of the "Telephone Forwarding Payment" page (`denwa-pay.html`) based on the validated V1 prototype. This page replaces static demos with real-time Firestore database synchronization.

### Technical details of implementation
- **Real-time Data Fetching**: Integrated Firebase SDK (v9 compat) to fetch payment plans from the `denwa_plans` collection.
- **Dynamic Filtering & Sorting**: 
    - Implemented client-side filtering for `status === 'ON'`.
    - Implemented automatic sorting by `price` in ascending order.
- **UI Refinement**:
    - Renamed "Manual Payment Link" to "通用付款連結" (General Payment Link) to better reflect its purpose for flexible amounts.
    - Updated bottom navigation to link back to the service introduction (`denwa.html`) instead of the home page.
    - Added skeleton loaders for improved perceived performance during data fetching.
- **Link Integrity**: Ensured the general payment link points to the fixed endpoint `https://pcpay.tw/NF4vv`.

### Affected files or modules
- `denwa-pay.html` [NEW]: Official payment page with dynamic integration.

### Chinese Summary
正式實作「電話代撥支付頁面」：串接 Firestore 資料庫實現動態載入方案，並依據金額由小到大自動排序。更新「通用付款連結」文字與底部署導航邏輯，確保與正式營運流程一致。

## [2026-02-28] - Denwa Pay Page UX Refinement

### Summary of changes
Refined the user experience of the `denwa-pay.html` page by simplifying the interaction model and cleaning up the visual presentation.

### Technical details of implementation
- **Interaction Model**: Removed individual "Pay" buttons; now the entire plan component is a clickable link for faster checkout.
- **Visual Cleanup**: 
    - Removed green box-shadow and vertical translation on hover for a flatter, more professional look.
    - Added brand-green border highlight as the primary hover state.
    - Added subtle scale-down effect (`0.98`) on click/active state for tactile feedback.
- **Typography and Layout**: Increased price font size in the list view to improve scannability.

### Affected files or modules
- `denwa-pay.html`: Refined interaction and styles.

### Chinese Summary
精煉「電話代撥支付頁面」互動體驗：移除獨立支付按鈕，改為點選整塊區域直接跳轉；簡化 Hover 視覺效果，僅保留品牌色邊框高亮，並加入點擊縮放回饋。

## [2026-02-28] - Admin Product Export Optimization

### Summary of changes
Optimized the "Export All Products" functionality in the admin panel to group products by brand and sort them accordingly to improve report organization.

### Technical details of implementation
- **Brand Sorting Logic**: Modified the `exportAllProductsToExcel` function to pre-sort fetched products by brand name using `zh-Hant` locale comparison, ensuring products from the same brand are grouped together.
- **Secondary Sorting Logic**: Added a secondary sort by `display_order` (and name if needed) within each brand group to maintain the user-defined product sequence.
- **Data Enrichment**: Integrated the `brandMap` during the export process to correctly associate brand IDs with their respective human-readable names for the final spreadsheet output.

### Affected files or modules
- `admin.html`: Updated `exportAllProductsToExcel` JavaScript logic.

### Chinese Summary
優化「匯出全品牌商品資料」：現在匯出 Excel 時，系統會自動將同品牌的商品排列在一起，並依照品牌名稱與顯示順序進行排序，大幅提升後台管理與帳務對帳的效率。

## [2026-02-28] - Unified Product Status and Admin UI Fixes

### Summary of changes
Resolved an inconsistency in product status values that caused some "Available" items to appear gray instead of brand green in the admin panel.

### Technical details of implementation
- **Status Unification**: 
  - Unified the status value for active products to `available` across all components (Single Edit, Batch Edit, New Product). Previously, some components used `in-stock`, which wasn't fully mapped to the `active-green` UI class.
  - Updated `renderProducts()` to recognize both `available` and `in-stock` as active states to ensure backward compatibility with existing data while transitioning to the unified standard.
- **Admin UI Consitency**:
  - Fixed the `statusClass` assignment in the product list to ensure the `active-green` class is applied whenever a product is in an active state.
  - Added "Discontinued" (已停產) to the individual product edit and creation modals for functional parity with batch editing.

### Affected files or modules
- `admin.html`: Unified status values in modals (`editProduct`, `showProductModal`) and matched colors in `renderProducts`.

### Chinese Summary
修正後台商品狀態色彩不一致的問題：統一將上架狀態值定為 `available`，並確保無論是單筆編輯還是批量管理，「供應中」標籤皆能正確顯示為品牌綠。同時將「已停產」選項補齊至所有商品管理介面。

## [2026-03-01] - PCHome Pay Integration (Backend)

### Summary of changes
Implemented official PCHome Pay payment integration in the Google Apps Script backend, providing a robust secondary payment option alongside ECPay.

### Technical details of implementation
- **Token Management**: Added `getPCHomePayToken` which implements HTTP Basic Auth to securely fetch short-lived access tokens from the PCHome Pay API.
- **Order Creation**: 
    - Implemented `handleCardPayment` logic for the `PCHomePay` provider.
    - Added support for automatic environment switching (Sandbox vs. Production) based on the provided `APP_ID`.
    - Integrated with PCHome Pay's `/v1/payment` endpoint to receive dynamic `payment_url` redirects.
- **WebHook Callbacks**: 
    - Added a routing rule in `doPost` to capture PCHome Pay's `notify_url` signals.
    - Implemented `handlePCHomePayNotify` to parse and verify `order_confirm` events.
    - Automated Firestore order status updates and multi-stage payment tracking matching the existing ECPay logic.
- **Email Notifications**: Synchronized the payment success email flow for both the customer and admin using existing HTML templates.
- **Payment Method Restriction**: Dynamic `pay_type` mapping implemented for PCHome Pay. The system now restricts the available payment channels on the PCHome Pay page based on the user's selection (e.g., Credit Card or ATM), ensuring UI consistency.

### Affected files or modules
- `gas/firebase_handler.gs`: core API integration, token handling, and result processing.

### Chinese Summary
實作 PCHome Pay 金流串接：支援自動取得 API Token、建立訂單並取得跳轉連結。同步實作 WebHook 回傳處理，確保付款後系統自動更新 Firestore 訂單狀態、同步支付階段並發送通知郵件，並優化支付管道限制，確保跳轉後僅顯示使用者選擇的付款方式。

## [2026-03-01T05:30:35Z]
### Summary of changes
- **Firebase Hosting Recovery**: Restored the correct project deployment for `keicha-membership-system` after an accidental overwrite by an external project.
- **URL Routing Optimization**: Enabled `cleanUrls` in `firebase.json` and added specific rewrite rules for `/admin` to ensure correct routing to `admin.html`.
- **Admin Panel Syntax Fix**: Resolved critical "Unexpected end of input" and "ReferenceError" in `admin.html`.
    - Escaped illegal `</script>` tags within JavaScript template literals.
    - Fixed unclosed `DOMContentLoaded` event listener that prevented script execution.
    - Restored missing `showShareButton` calls.

### Affected files or modules
- `firebase.json`: added cleanUrls and admin rewrite rules.
- `admin.html`: fixed syntax errors and unclosed code blocks.

### Chinese Summary
恢復因錯誤部署受損的 Firebase Hosting 專案，並修復 `admin.html` 的嚴重語法錯誤（包含標籤轉義錯誤與未閉合的括號），同時優化路由規則，支援透過 `/admin` 短網址直接存取。

## [2026-03-01T07:02:29Z]
### Summary of changes
- **Admin Panel Order Export**: Implemented a unified "Export Logistics Orders" button to compile both standard (`orders`) and link-based (`card_orders`) transactions containing shipping information.
    - Excludes 'Completed' and 'Cancelled' statuses to filter only actionable orders.
    - Autogenerates a single `.xlsx` file segmenting records into "全家訂單" and "7-11訂單" sheets adhering to the exact merchant-prescribed structure and columns.
    - Sorts records chronologically by most recent `created_at` timestamp.
- **UI Bug Resolution**: Corrected an improperly structured `<div>` inline property syntax error (`< div style = "margin-bottom: 12px;" >`) causing a visual bug in the card links view.

### Affected files or modules
- `admin.html`: Injected `exportLogisticsOrders()` function, `exceljs` processing, and removed faulty structural divs.

### Chinese Summary
在管理員後台實作「匯出物流訂單」功能，將標準訂單與連結訂單中含有物流資料、且未完成/未取消的項目，依建立時間降冪排序後，統一輸出成含「全家」與「7-11」獨立分頁的 Excel 檔案。同時修復了刷卡連結管理頁面上一處多餘的 HTML 文字破圖問題。

## [2026-03-01T08:05:00Z]
### Summary of changes
- **Enhanced Order Export Filtering**: Refined `exportLogisticsOrders()` to include multiple logistics-related fields (`logistics`, `logistics_type`, `shipping_method`, `method`), ensuring orders with diverse naming conventions are correctly identified.
- **Improved Order Data Mapping**: Expanded field detection for exports, including `items_text` for product descriptions and alternative total/shipping amount keys (`total`, `shipping`) to cover both standard and link-based orders.
- **Brand UI Alignment**: Switched the order export confirmation from a native `confirm()` to the brand's custom `KUI.confirm()` dialog.
- **Robust Card Link Copying**: Fixed the `copyCardLink()` function to correctly handle root path deployments (`/admin` vs `/admin.html`) by dynamically detecting and replacing the base path, ensuring generated payment links are always accurate.

### Affected files or modules
- `admin.html`: Updated `exportLogisticsOrders()` and `copyCardLink()` logic.

### Chinese Summary
優化「匯出物流訂單」的篩選邏輯，相容更多物流相關欄位（logistics, method 等）並支援更廣泛的商品與金額欄位名稱，確保資料不遺漏。同時修正了「支付連結」複製時因 URL 路徑不一致導致的錯誤問題，並將確認視窗統一更換為品牌風格的 `KUI.confirm` 組件。

## [2026-03-01T08:45:00Z]
### Summary of changes
- **Testing Module Path Fix**: Removed the erroneous `/keicha/` segment from the generated test URLs in `admin.html` to ensure they point accurately to the root pages (e.g., `fast.html`).
- **Removed Deprecated Test Actions**: Cleaned up the Testing Module UI by removing the two legacy "Card Order" testing buttons (PC-T, EC-T) as they are no longer required for current workflows.
- **Resolved Logistics Options Duplication**: Fixed a bug in `fast.html` where legacy logistics methods like "7-11" and "全家" were being erroneously appended alongside the updated labels (e.g., "7-11 店到店"). The detection logic now utilizes `.some()` to verify any inclusive match within the enabled methods before appending fallbacks.

### Affected files or modules
- `admin.html`: Updated `goTestPage` URL construction and removed redundant button elements.
- `fast.html`: Updated the logistics rendering logic to check for substring matches using `Array.some`.

### Chinese Summary
修復測試模組自動帶入時網址多了 `/keicha/` 導致開啟錯誤頁面的問題，並依需求移除了不必要的兩顆「刷卡測試」按鈕。同時修正了 `fast.html` 中物流選項（如 7-11、全家）因比對邏輯錯誤而重複顯示的 Bug。

## [2026-03-01T10:45:00Z]
### Summary of changes
- **Admin UI Multi-select**: Implemented a long-press multi-select feature across all order lists (`orders`, `denwa_orders`, `card_orders`) in `admin.html`. 
- **Batch Actions Integration**: Added a floating batch action bar that supports bulk status updates and bulk deletion.
- **Delete Icon Standardization**: Unified all delete action icons across the admin panel to a consistent grey color (`#64748b`) with neutral button styling.
- **Status Terminology Unification**: Standardized order statuses to four core states: '待處理', '已確認', '已完成' (in Brand Green), and '已取消'.
- **Order Tracking Sorting**: Updated `jyoukyou.html` to sort order tracking results by creation date in descending order (newest first).

### Affected files or modules
- `admin.html`: Added multi-select logic, batch action UI, unified status badges, and standardized delete icons.
- `jyoukyou.html`: Injected `createdAt` timestamp sorting into the unified search results array.

### Chinese Summary
這版主要的更新在「提升後台管理效率」與「視覺定義」。在訂單、預約、與刷卡連結列表中，新增了長按卡片即進入「多選模式」的功能，並加入底部懸浮工具列以支援「批次刪除」與「批次更改狀態」；同時統一了全站刪除按鈕的樣式與訂單狀態用語（待處理、已確認、已完成、已取消）。最後，前台「訂單追蹤」系統現在會聰明地按照建立時間「由新到舊」自動排序了。

## [2026-03-01T11:45:00Z]
### Summary of changes
- **Unified Backend Statuses**: Standardized all backend database status mappings to use `available` and `discontinued` across Products, Brands, Plans, and Card Links.
- **Frontend Status Normalization**: Updated `maccha-store.html` and `maccha-loader.js` logic to stringently display `可訂購` (available) and `缺貨中` (sold out) in place of varied legacy terms.
- **Admin Modal Alignment**: Aligned all admin edit and creation modals (Select dropdown options) for Brands, Plans, and Fast Checkouts to strictly match the unified status conventions.

### Affected files or modules
- `admin.html`: Status badge rendering and select options.
- `maccha-store.html`: UI button logic and status badges.
- `maccha-loader.js`: Product data mapping logic.

### Chinese Summary
統一後台資料庫與前台所有的商品、品牌、方案、刷卡連結的狀態對應文字。後台一律使用 `available` 與 `discontinued`（介面為：啟用中、缺貨中、已隱藏），前台使用者介面則一律顯示「可訂購」及「缺貨中」，完全消弭了過去包含 ON/OFF、完售、已停辦等多種雜亂的用字，提升整體一致性。


## [2026-03-01T11:49:33Z]
### Summary of changes
- **Status Enum Overhaul**: Completely migrated backend status representations to English strings (`pending`, `confirmed`, `completed`, `cancelled`) across all administration modules and checkout processes.
- **Frontend Sync**: Updated dropdown menus, validation rules, and status badge parsers in `admin.html` to align with the new standard English enums.
- **Card Order Integration Check**: Validated `card-order.html` to ensure `available` is queried accurately alongside legacy `開啟` properties.
- **Migration Tool Implementation**: Built and embedded a one-shot `Database Status Repair` algorithm in the '系統維護' module to seamlessly migrate legacy strings to the standardized dictionary across `denwa_products`, `denwa_brands`, `denwa_plans`, `card_orders_links`, `orders`, and `denwa_orders`.

### Technical details of implementation
- Restructured all string-based condition tests globally for order tracking, display parsing, and dropdowns. 
- Integrated Firestore `db.batch()` chunked commit mechanisms to ensure performance and reliability throughout the migration.

### Affected files or modules
- `admin.html`: Injected `startDatabaseRepairTool()` logic and updated multi-select actions to emit english payloads.
- `order.html`: Timeline parsing logic.
- `card-order.html`: Payment link availability checks.

### Chinese Summary
這次針對方案A的需求，全面將資料庫底層狀態以標準英文單字儲存（pending, confirmed, completed, cancelled...等）。為了過渡期，我們在後台寫好了一支「資料庫狀態統一修復工具」，按下去就可以用批次處理安全地翻新成千上萬筆舊資料為標準英文；同時全面檢查了所有的介面、包含前台的連結和進度條，來確保這項轉換是暢通無阻的。

## [2026-03-01T20:15:00Z]
### Summary of changes
- **Admin Maintenance UI Refinement**: Adjusted the "System Maintenance and Repair" (系統維護與修復) module to follow a strict grayscale design system.
- **Grayscale Design System**: Removed all red, yellow, and orange accent colors from the Database Standardization tool, replacing them with neutral slate and gray tones.
- **Emoji Removal**: Stripped all emojis (⚠️, 🎉) from the user interface and operation logs to maintain a professional, technical aesthetic.

### Technical details of implementation
- **Schema Alignment**: Corrected the repair tool's target collection names from `denwa_products`/`denwa_brands` to `matcha_products`/`matcha_brands` to align with the production Firestore structure.
- **Style Overhaul (`admin.html`)**: Updated the primary container style from yellow-toned (`#fffdf2`, `#fcd34d`) to slate-toned (`#f8fafc`, `#cbd5e1`).
- **Accent Neutralization**: Reassigned the action button and icon colors to `#475569` and `#64748b`.
- **Log Sanitation**: Modified `startDatabaseRepairTool()` to output plain text logs, removing emoji prefixes and using neutral toast types.

### Affected files or modules
- `admin.html`: Maintenance tab styling and repair tool JavaScript logic.

### Chinese Summary
將系統維護與修復（資料庫轉換工具）的介面全面改為灰色系設計，移除了所有的 Emoji、紅色、橘色偏黃等鮮豔屬性，確保介面風格專業且低調，僅使用中性的灰色調進行呈現。

## [2026-03-01T20:25:00Z]
### Summary of changes
- **Batch Edit Workflow**: Added automatic modal closing and data reloading after successful batch updates or deletions.
- **Improved Confirmations**: Implemented status label translation in confirmation messages (e.g., 'completed' to '已完成').
- **Custom Delete Dialog**: Replaced the native `prompt()` with a custom `KUI.prompt` component for batch delete confirmation, ensuring consistent styling.
- **UI Label Update**: Renamed '測試模組' to '測試' across the navigation and content sections.
- **Loading Overlay**: Integrated loading indicators with modal transitions.

### Technical details of implementation
- **KUI System Extension**: Added `KUI.prompt` function to `js/ui-dialog.js` with auto-focus and Enter-key submission.
- **DOM Event Handling**: Added `closeModal()` calls within Firestore batch update completions.
- **Text Refactoring**: Standardized naming across HTML tags and JavaScript comments for the 'Testing' module.

### Affected files or modules
- `admin.html`: Batch action functions and UI labels.
- `js/ui-dialog.js`: Core dialog management logic.

- **Status Terminology Unification**: Created `js/status-config.js` to centralize all status labels and UI badge rendering.
- **Link Order Mapping**: Standardized "Card Order" status to `confirmed` (Previously `paid`), aligning with backend terminology.
- **Workflow Consistency**: Ensured all edit and delete operations in the admin panel trigger a modal close and automated data reload.
- **Improved UX**: Upgraded individual delete confirmations to use the custom KEICHA UI dialog system.

### Technical details of implementation
- **Batch Action Flow**: Reordered `exitBatchMode()` to occur after UI data reloads in `admin.html` to preserve the active context during list refresh.
- **CSS Consistency**: Updated inline styles for installments count badges to use pill-shaped radius (`9999px`).
- **GAS compatibility**: Modified `firebase_handler.gs` to recognize `available` and `active` as open link statuses.

### Affected files or modules
- `admin.html`: Fixed batch logic and badge styles.
- `gas/firebase_handler.gs`: Updated checkout validation logic.
- `CHANGELOG.md`: Updated with newest maintenance notes.

### Chinese Summary
修正了批次操作後不會自動關閉或刷新的邏輯錯誤。統一了「分次/階段」標籤的圓角設計。更新了後端 GAS 腳本，使其支援新的「啟用中」狀態碼，解決了結帳時出現「連結已關閉」的報錯。

---

### [1.2.9] - 2026-03-01

#### **Summary of changes**
Implemented real-time synchronization of member profile data to Firestore. As users enter their information in `denwa-form.html` and `fast.html`, the data is automatically updated/created in the `members` collection using a debounced mechanism.

#### **Technical details of implementation**
- **Member Sync Utility**: Created `js/member_sync.js` which provides a reusable `MemberSync` object. It includes a 2000ms debounce function to optimize Firestore write operations and uses the phone number as the document ID for the `members` collection.
- **Form Integration (Fast Checkout, DIY, Matcha Store)**: Added/Refined listeners across `fast.html`, `diy.html`, and `maccha-store.html` to capture both personal details and shipping information (store IDs, addresses) in real-time.
- **Exclusion**: Removed synchronization logic from `denwa-form.html` as requested.
- **Persistence**: Synchronized data is automatically available for auto-filling forms on subsequent visits via the existing lookup logic.

#### **Affected files or modules**
- `js/member_sync.js`: [NEW] Central sync utility.
- `denwa-form.html`: Integrated real-time sync into booking flow.
- `fast.html`: Integrated real-time sync into fast checkout flow.

> 實現會員資料「輸入即存檔」功能，自動同步聯絡資訊與收件地址至 Firestore。
> 提升客戶填單體驗，確保資料在未送出前即已完成建檔或更新。

---

### [1.2.10] - 2026-03-01

#### **Summary of changes**
- Fixed a bug where `denwa_plans` failed to load in `denwa-form.html` by updating the criteria to include `available` status as managed by the admin panel.
- Fixed `STATUS_MAP is not defined` ReferenceError in `jyoukyou.html`, ensuring proper translation of order statuses (pending, confirmed, completed, cancelled) to traditional Chinese.

#### **Technical details of implementation**
- **Denwa Plans Hotfix**: Changed the Firebase document query in `denwa-form.html` to accept both `'ON'` and `'available'` statuses, ensuring backward compatibility and consistency with the updated admin data structure.
- **Jyoukyou Status Fix**: Reinitialized the `STATUS_MAP` inline object in `jyoukyou.html` to map internal English status keys to localized Traditional Chinese display strings.

#### **Affected files or modules**
- `denwa-form.html`
- `jyoukyou.html`

**中文說明：**
修復了 `denwa-form.html` 方案未正常載入的異常，將判定條件放寬以支援由後台設定的 `available` 狀態；修復了 `jyoukyou.html` 查詢結果出錯（`STATUS_MAP` 未定義）的問題。

---

### [1.2.11] - 2026-03-01

#### **Summary of changes**
- Implemented a one-time "Member Data Migration Tool" in the admin panel to consolidate and standardize member document IDs.
- Unified all member data write and read paths across `diy.html`, `fast.html`, `maccha-store.html`, and `shop/shop.js` to strictly use the phone number as the document ID in Firestore.

#### **Technical details of implementation**
- **Migration Tool**: Added a script in `admin.html` that queries the `members` collection, identifies documents with random (legacy) IDs, and merges their data into standard `doc(phone)` documents before securely deleting the redundant entries.
- **Write Path Refactor**: Replaced `db.collection('members').where('phone', '==', phone)` update/add flows with atomic `db.collection('members').doc(phone).set(data, { merge: true })` calls. This guarantees that multiple checkout flows will not overwrite or duplicate member profile data (especially critical for differing logistics data like `store_711` vs `store_fami`).
- **Read Path Refactor**: Updated lookups to use `.doc(phone).get()` instead of `.where().limit(1).get()`, significantly improving lookup efficiency and ensuring compatibility with the new ID structure.

#### **Affected files or modules**
- `admin.html`: Added the migration layout and logic.
- `diy.html`, `fast.html`, `maccha-store.html`: Refactored Firestore read/write patterns.
- `js/checkout_core.js`, `shop/shop.js`: Refactored Firestore read/write patterns for shared/shop environments.

**中文說明：**
建立了一次性的會員資料轉移工具，將舊的隨機 ID 會員資料整併。全面統整了前台所有表單寫入及讀取路徑，統一使用「手機號碼」作為文件 ID 並搭配 `merge: true` 寫入，徹底解決超商物流點位資料會互相覆蓋或遺失的 Bug。

---

### [1.2.12] - 2026-03-01

#### **Summary of changes**
- Updated all legacy navigation links pointing to the deprecated `maccha.html` to direct to the new shopping cart version `maccha-store.html`.
- Included a dedicated contact section at the bottom of the `maccha-store.html` page to handle inquiries about other matcha brands via the LINE Official Account.

#### **Technical details of implementation**
- **Global Link Updates**: Replaced URL references to `maccha.html` with `maccha-store.html` across core template components (header/footer/index) and within structured JSON-LD SEO data in `maccha-loader.js`.
- **Store Enhancement**: Created a new white card section near the bottom of the product list in `maccha-store.html`. Adjusted CSS padding and margins (`py-12 md:py-16`, `mt-12`, `mb-0`, and `pb-12` on main container) to vertically align and visually balance the section with the site footer. Added hover elevation and shadows matching the design of the central brand cards (`shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-300`).

#### **Affected files or modules**
- `index.html`
- `_includes/header.html`
- `_includes/footer.html`
- `assets/js/maccha-loader.js`
- `maccha-store.html`

**中文說明：**
全面將舊版 `maccha.html` 抹茶代購的連結替換至支援購物車的 `maccha-store.html`。並在商城底部新增純白質感的「其他品牌代購（LINE客服）」聯絡區塊，設定等距版面留白與懸浮陰影特效。

---

### [1.2.13] - 2026-03-01

#### **Summary of changes**
- Updated the privacy policy content in `assets/data/privacy.tsv` to accurately reflect the current business model and data collection methods, removing irrelevant boilerplate text.

#### **Technical details of implementation**
- **Data Collection Accuracy**: Modified section "一、資料蒐集方式與項目" to explicitly mention the "website member checkout system" and secure storage in an internationally certified cloud database (Firebase).
- **Third-Party Providers**: Corrected section "五、第三方服務與資料提供" by replacing generic examples ("restaurants, hotels, transportation") with the actual third-party checkout and logistics platforms used by the business (7-11 Myship, FamilyMart FamiStore, and Google integrations).

#### **Affected files or modules**
- `assets/data/privacy.tsv`

**中文說明：**
修正了隱私權條款內容（`privacy.tsv`），移除了不相關的第三方公版舉例（如餐廳、飯店等），並明確加入實際使用的物流平台（7-11 賣貨便、全家好賣+）與符合國際資安標準的雲端會員結帳系統（Firebase）說明，以符合實際業務現況並提升客戶信任。

---

### [1.2.14] - 2026-03-02

#### **Summary of changes**
- Fixed an issue in `denwa-pay.html` where payment plans failed to load because it was strictly matching the legacy `'ON'` status instead of the newly standardized `'available'` status.

#### **Technical details of implementation**
- **Plan Loading Criteria Update**: Expanded the array filter condition in `denwa-pay.html` to accept `p.status === 'ON' || p.status === 'available'`. This aligns with the previous updates made to `denwa-form.html` to ensure compatibility with how plan statuses are currently managed in the admin backend.

#### **Affected files or modules**
- `denwa-pay.html`

**中文說明：**
修復了 `denwa-pay.html` 中無法正常顯示電話代撥支付方案的問題。主因與先前預約表單相同，原系統只判斷舊有的 `ON` 狀態，現在已將條件加上支援後台設定的 `available` 狀態。

---

### [1.2.15] - 2026-03-02

#### **Summary of changes**
- Synchronized the member data read/write logic in `card-order.html` with the rest of the application to ensure profile consistency across all checkout entry points.

#### **Technical details of implementation**
- **Read Path Migration**: Updated `lookupPhoneData` in `card-order.html` to fetch member profiles using direct document IDs (`db.collection('members').doc(phone).get()`) instead of query-based filtering.
- **Auto-Sync on Checkout**: Implemented a background sync in `submitOrder` that automatically updates the user's `members` document with the latest name, email, LINE name, and logistics preferences (Store ID or Address) whenever a card payment is initiated.
- **Atomic Operations**: Used `set(..., { merge: true })` to prevent accidental overwrites of existing member fields while ensuring new information is captured reliably.

#### **Affected files or modules**
- `card-order.html`

**中文說明：**
統一了專屬刷卡頁面 (`card-order.html`) 的會員資料讀寫邏輯。現在當客人在刷卡結帳時更新收件姓名、Email 或取貨門市，系統會自動將最新資訊同步回資料庫的會員存檔中，確保客人在不同頁面間購物時的一致性體驗。

---

### [1.2.16] - 2026-03-02

#### **Summary of changes**
- Fixed display inconsistencies and data mapping errors in the order tracking page (`jyoukyou.html`).

#### **Technical details of implementation**
- **Calculation Correction**: Updated card order display to calculate "Total Amount" by summing `base_amount` and `shipping_fee` as a fallback, ensuring the total matches the breakdown even if `total_budget` was saved incorrectly in the database.
- **Mapping Fixes**: Corrected "Seller Remark" mapping for card orders to correctly pull from `seller_note` instead of the buyer's `note` field.
- **Status Unification**: Standardized status labels across all order types to `待處理`, `已確認`, `已取消`, and `已完成` using a unified `STATUS_MAP`.
- **UI Styling**: Updated status badge colors to match brand requirements—only `已完成` (Completed) is Green, while all other statuses are now uniformly Grey.

#### **Affected files or modules**
- `jyoukyou.html`

**中文說明：**
修復了訂單查詢頁面 (`jyoukyou.html`) 的顯示問題。包括修正刷卡訂單的總計金額計算（避免漏算運費）、修正「賣家留言」誤抓成客人備註的問題。同時統一了所有訂單類型的狀態名稱（待處理、已確認等）與配色，確保只有「已完成」顯示為綠色，其餘進度皆以灰色顯示，維持介面語義一致。

---

### [1.2.17] - 2026-03-02

#### **Summary of changes**
- Reorganized the project root directory to improve maintainability and follow better structural patterns.

#### **Technical details of implementation**
- **Folder Creation**: Created `/admin`, `/docs`, and `/archive` directories to categorize root-level files.
- **File Relocation**: 
  - Moved `admin.html` and `admin_fast.html` to `/admin/`.
  - Moved documentation (`DATABASE_SCHEMA.md`, `DEPLOY_GUIDE.md`, etc.) to `/docs/`.
  - Moved legacy/test files (`seed.html`, `original_denwa.html`, etc.) to `/archive/`.
- **Link Integrity**: Updated `admin.html` to use absolute paths for CSS and JS assets to ensure functionality from the new subfolder.
- **Hosting Configuration**: Updated `firebase.json` rewrite rules to map `/admin` to `/admin/admin.html`, preserving the clean administrative URL.
- **Documentation Updates**: Renamed `PChomePay API.md` to `PChomePay_API.md` and updated internal documentation references.

**中文說明：**
完成了專案根目錄的結構重整，將管理後台、系統文件、以及舊版/測試檔案分別歸類至 `/admin`、`/docs` 與 `/archive` 資料夾中。同時更新了 Firebase Hosting 的路徑對應，確保原本的 `/admin` 存取網址依然有效，並修正了移動後的檔案連結以維持功能正常。

---

### [1.2.18] - 2026-03-02

#### **Summary of changes**
- Refined billing logic and total amount visibility in the order tracking page (`jyoukyou.html`).

#### **Technical details of implementation**
- **Calculation Correction**: Forced "Total Amount" to always be calculated as `subtotal + shipping_fee`. Added a fallback to the current total "amount" for legacy orders where individual items were not captured.
- **Conditional Visibility**: Implemented logic to hide the "Stage Payment" (本階段支付) row if the current amount to pay equals the total order value, reducing clutter for single-payment orders.
- **Data Mapping Enhancement**: Expanded Firestore data mapping to bridge `baseAmount` and `shippingFee` for all order types (Matcha, Denwa, and Custom Card links).

**中文說明：**
優化了訂單查詢頁面 (`jyoukyou.html`) 的款項顯示邏輯。現在「總計金額」會強制限於「商品金額 + 運費」，若單次付清則會自動隱藏「本階段支付」欄位，僅在兩階段付款或金額不一致時才會額外顯示，使帳單明細更直觀清晰。

---

### [1.2.19] - 2026-03-02

#### **Summary of changes**
- Improved CSS compatibility and resolved syntax warnings across multiple components.

#### **Technical details of implementation**
- **Browser Compatibility**: Added standard `appearance: textfield` property alongside `-moz-appearance` for number inputs to ensure consistent UI across modern browsers.
- **Syntax Correction**: Removed invalid `ring` CSS property (Tailwind utility misused in standard CSS) and replaced it with standard `box-shadow` focus states in `diy.html` and `admin/admin_fast.html`.
- **UI Consistency**: Standardized focus ring aesthetics to match the brand design system (3px spread, 10% opacity brand green).

**中文說明：**
提升了 CSS 的瀏覽器相容性並修正語法錯誤。修正了數字輸入框在非 Firefox 瀏覽器下的顯示相容性，並將 CSS 中誤用的 `ring` 屬性替換為標準的 `box-shadow` 聚焦效果，確保介面在不同環境下都能穩定呈現設計規範。

---

### [1.2.20] - 2026-03-02

#### **Summary of changes**
- **UI Refinements**: Updated placeholders in `denwa-form.html` to clarify input requirements (Shopee ID, Booking Name). Simplified "特殊備註" label to "備註".
- **Plan Loading Logic**: Expanded Firestore filtering in `denwa-form.html` to include both `ON` and `available` status for plans. Added logging for easier debugging.
- **Path Integrity**: Restored `form-result.html` and `fast-diy-result.html` to the root directory, fixing the 404 error on redirection.
- **Pre-Deployment Sync**: Verified local file existence and sync before final build.
- **Admin Access Restoration**: Moved `admin.html` and `admin_fast.html` back to the root directory from `/admin/` as GitHub Pages redirection issues caused 404. Updated `firebase.json` for mapping.
- **Permalink Optimization**: Removed `permalink: /admin` in favor of direct file access for maximum compatibility across environments.
- **Admin URL Update**: The master admin interface is now back to `https://keicha2025.github.io/admin.html`.

**中文說明：**
因 GitHub Pages 的轉址設定導致子目錄下的管理介面出現 404 錯誤，現已將 `admin.html` 與 `admin_fast.html` 搬回根目錄。現在 GitHub 正向入口均恢復正常（URL 為 `https://keicha2025.github.io/admin.html`），並同步更新了 Firebase 的轉址規則確保兩端一致。

---

### [1.2.21] - 2026-03-02

#### **Summary of changes**
- Expanded configuration state checks in the fast checkout frontend logic to resolve "Shop Closed" misidentification.

#### **Technical details of implementation**
- **Status Value Check Relaxation**: Updated `renderPageConfig()` function inside `fast.html`. The page previously only recognized exactly `'開啟'` as an active fast-checkout shop state. Modified the condition (`!['開啟', 'available', 'ON'].includes(fastConfig.status)`) to interpret `'available'` and `'ON'` (produced by the admin or default database setups) as valid open states. This unblocks the user interface without altering backend structure or previously saved document states.

**中文說明：**
修正了 `fast.html` 快速結帳頁面的賣場開啟狀態判斷，將 `available` 與 `ON` 等資料庫實際儲存的值一併納入「開啟」的條件，避免明明後台已設定開啟，前端卻被「目前未開放」遮罩卡住的問題。

---

### [1.2.22] - 2026-03-02

#### **Summary of changes**
- Synchronized admin toggle logic with the expanded status values to correctly reflect and update the shop state.

#### **Technical details of implementation**
- **Admin Toggle Initialization**: Updated `fillForm()` in `admin_fast.html` to check if the status is one of `['開啟', 'available', 'ON']`, ensuring the UI toggle correctly initializes to "ON" for all valid open states.
- **Admin Status Persistence**: Updated `saveConfig()` in `admin_fast.html` to save the active status as `'available'` instead of `'開啟'`, aligning with the new project standard and ensuring consistent behavior between frontend and backend.

**中文說明：**
修正了快速結帳後台 (`admin_fast.html`) 的狀態開關邏輯。現在進入頁面時，「賣場狀態開關」能正確讀取並反映資料庫中的多種開啟狀態（包含 `available` 與 `ON`），且儲存時會統一使用 `available` 狀態，確保與前台邏輯及專案資料庫規範一致。

---
