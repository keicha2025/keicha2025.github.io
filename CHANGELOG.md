# Changelog

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

