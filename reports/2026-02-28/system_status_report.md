# KEICHA 系統對接情況排查報告 (2026-02-28)

## 0. 報告概覽 (Overview)
本報告針對 KEICHA 專案的使用者端、管理者端與後端（Firebase/GAS）對接情況進行全面檢測。目前系統運作穩定，各主要功能模組（抹茶代購、電話代撥）的資料讀寫鏈路均維持通暢。

---

## 1. 需處理 (Needs Attention) - 🔴 高優先級

### 1.1 資料庫安全規則脆弱性 (Firestore Rules)
- **問題描述**：`order_counters` 集合的讀寫權限目前設置為 `if true`（全開放），這可能導致惡意使用者惡意重置或增加訂單編號流水線。
- **風險**：訂單編號混亂、衝突，影響後台對帳。
- **檔案**：`firestore.rules:L35`

### 1.2 管理者身分硬編碼 (Hardcoded Admins)
- **問題描述**：管理者 Email (`wj209ing@gmail.com`) 同時硬編碼在 `admin.html`、`firestore.rules` 與 GAS `firebase_handler.gs` 中。
- **建議**：未來若增加協作者，修改成本高。應考慮將管理者名單存入 Firestore `system_config` 集合或利用 Firebase Auth Custom Claims。
- **影響**：維護靈活性不足。

### 1.3 App Check 與 Source Token 的冗餘與安全性
- **問題描述**：前端已啟用 Firebase App Check，但 Firestore Rules 仍大量依賴 `source_token == 'keicha_2025_web_auth'` 進行寫入校驗。
- **建議**：應逐步轉向 App Check 驗證，並廢棄容易被攔截的靜態 Token。

---

## 2. 可優化 (Optimizable) - 🟡 中優先級

### 2.1 外部支付連結管理 (Payment Link Centralization)
- **問題描述**：`index.html` 中的 PCHomePay 連結是靜態寫死的，而 `denwa_plans` 則動態讀取資料庫。
- **優化建議**：將所有第三方支付連結統一存入 Firestore 進行動態管理，方便隨時切換金流商。

### 2.2 管理者後台代碼維護性 (Admin Code Refactoring)
- **問題描述**：`admin.html` 單一檔案已接近 5000 行，包含了大量業務邏輯、UI 渲染與 Firebase 操作。
- **優化建議**：將 JavaScript 邏輯抽離至外部模組（如 `js/admin_orders.js`, `js/admin_products.js`），提升開發效率與可讀性。

---

## 3. 無異狀 (Normal) - 🟢 穩定運行

### 3.1 資料結構一致性 (Data Schema Integrity)
- **檢測結果**：目前的 Firestore 實作完全符合 `DATABASE_SCHEMA.md` 定義的欄位規範。
- **狀態**：正常。

### 3.2 GAS 通知鏈路 (GAS Notification Pipeline)
- **檢測結果**：`firebase_handler.gs` 處理 `new_denwa_order` 與 `new_matcha_order` 的邏輯清晰，包含對 ECPay 的支援與 Email 模板渲染均無異狀。
- **狀態**：正常。

### 3.3 UI 規範合規性 (Visual Design Standards)
- **檢測結果**：前端與後台均採用了 `DESIGN_SYSTEM.md` 規範的 8pt 級距（Spacing）與圓角 Token (`Radius-MD`, `Radius-LG`)。
- **狀態**：正常。

---

**報告完成日期：2026年2月28日**
**執行代號：SYSTEM_AUDIT_20260228**
