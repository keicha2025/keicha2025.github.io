# KEICHA 系統診斷與優化建議報告

> **報告日期**：2026-03-04  
> **報告版本**：v1.0  
> **專案版本**：v1.3.8  
> **分析者**：Antigravity — 高階產品技術顧問  
> **涵蓋範圍**：`admin.html`、`card-order.html`、`denwa-form.html`、`gas/firebase_handler.gs`、`js/*`、`firestore.rules`、資料庫架構

---

## 目錄

1. [待解決問題 (Pending Issues)](#1-待解決問題-pending-issues)
2. [系統隱患 (Potential Risks)](#2-系統隱患-potential-risks)
3. [可優化建議 (General Optimization)](#3-可優化建議-general-optimization)
4. [UI 優化建議 (UI Improvements)](#4-ui-優化建議-ui-improvements)
5. [UX 優化建議 (UX Enhancements)](#5-ux-優化建議-ux-enhancements)
6. [優先級建議清單 (Priority List)](#6-優先級建議清單-priority-list)

---

## 1. 待解決問題 (Pending Issues)

### 1.1 訂單狀態映射不一致

| 項目 | 詳情 |
|------|------|
| **問題描述** | Firestore 中 `card_orders` 的 `payment_status` 歷史資料存在 `'paid'` 與 `'completed'` 兩種值。Admin 面板中以 `displayStatus = data.payment_status === 'paid' ? 'confirmed' : ...` 進行映射，但該映射邏輯未處理新值 `'completed'`，導致已付款訂單在後台可能顯示 `pending` 狀態的 Badge，資料視覺上不正確。 |
| **嚴重程度** | 🔴 **高** |
| **受影響位置** | `admin.html` Line 5082、Firestore `card_orders` 集合 |

**修正方向**：
```javascript
// admin.html loadCardOrders() 中
const displayStatus = (data.payment_status === 'paid' || data.payment_status === 'completed')
  ? 'confirmed'
  : (data.payment_status || 'pending');
```

---

### 1.2 重新付款 (Repay) 功能對 PCHomePay 的路由問題

| 項目 | 詳情 |
|------|------|
| **問題描述** | `handleRepayOrder()` 在函數開頭就生成了 ECPay 的 HTML 表單，即使後續判斷到 `config.payment_provider === 'PCHomePay'` 成功呼叫 PCHomePay 後，已生成的 ECPay HTML 仍然多占了記憶體。更嚴重的是，若 PCHomePay API 呼叫失敗，函數最終會 `fallthrough` 並返回 ECPay 的 HTML，導致客戶被導向錯誤的金流平台（ECPay）進行付款，但訂單卻是 PChome Pay 類型的訂單，將造成回調對應錯誤。 |
| **嚴重程度** | 🔴 **高** |
| **受影響位置** | `gas/firebase_handler.gs` Line 368-421 |

**修正方向**：應先判斷金流商，再決定生成哪個類型的付款資訊，ECPay 表單的生成應放在確認為 ECPay 流程之後。

---

### 1.3 `card-order.html` 的 Firebase 初始化未使用全域模組

| 項目 | 詳情 |
|------|------|
| **問題描述** | `card-order.html` 自行初始化了一套 Firebase（Line 15-28），而未使用已建立的全域模組 `js/firebase-services.js`，造成初始化邏輯雙重存在。在 `denwa-form.html` 則正確使用了 `firebase-services.js`。這個不一致性使得未來若要修改 App Check key 或 Firebase config，需要在兩處分別維護，容易漏改。 |
| **嚴重程度** | 🟡 **中** |
| **受影響位置** | `card-order.html` Line 8-28 |

---

### 1.4 `order_counters` 集合的 Firestore 安全規則過於開放

| 項目 | 詳情 |
|------|------|
| **問題描述** | `firestore.rules` 中對 `order_counters` 集合設定了 `allow read, write: if true;`，任何未經授權的用戶均可任意讀寫計數器，這可能被惡意利用來混亂訂單編號序列（刷高計數器讓合法訂單跳號）。 |
| **嚴重程度** | 🟡 **中** |
| **受影響位置** | `firestore.rules` Line 34-36 |

---

### 1.5 GAS 端 `createJSONResponse` 函數重複定義

| 項目 | 詳情 |
|------|------|
| **問題描述** | `firebase_handler.gs` 中 `createJSONResponse` 函數被定義了兩次（Line 534 與 Line 1090），GAS 在執行期間以最後一個定義為主，目前不影響功能，但這是潛在的程式碼汙染，未來若修改其中一個而忘記同步另一個將形成 Bug。 |
| **嚴重程度** | 🔵 **低** |
| **受影響位置** | `gas/firebase_handler.gs` Line 534 & 1090 |

---

### 1.6 Admin 面板缺少行動裝置視圖

| 項目 | 詳情 |
|------|------|
| **問題描述** | `admin.html` 的標籤欄 (`.tabs`) 雖有 `overflow-x: auto` 支援捲動，但大量的資料表格 (`data-table`) 並未適當的響應式處理，在行動裝置上（寬度 < 768px）表格欄位會嚴重擠壓，導致管理員在手機上幾乎無法正常操作訂單管理。 |
| **嚴重程度** | 🟡 **中** |
| **受影響位置** | `admin.html` 全站表格樣式 |

---

## 2. 系統隱患 (Potential Risks)

### 2.1 🔐 資安風險：`source_token` 為靜態明文金鑰

**描述**：目前系統的「非授權寫入防護」機制完全依賴 Firestore Rules 中的 `source_token == 'keicha_2025_web_auth'`。此 Token 以明文形式硬編碼在前端 `firebase_handler.gs` 和前端 JS 中，任何人只需開啟 DevTools 便可查看。攻擊者可偽造帶有該 Token 的請求，繞過保護直接向 Firestore 寫入惡意資料（如偽造訂單）。

**建議修正**：
- 短期：使用 Firebase App Check（已部分實施），它在 Firestore Rules 層可透過 `request.app` 驗證請求來自合法應用，比 `source_token` 更可靠。
- 長期：訂單建立應改為透過 GAS 作為唯一代理（Server-Side Only），前端只負責觸發，不直接寫入 Firestore。

---

### 2.2 🔐 資安風險：管理員身份驗證方式脆弱

**描述**：`firestore.rules` 的 `isAdmin()` 函數僅依賴 `request.auth.token.email == 'wj209ing@gmail.com'`，以 email 硬編碼作為管理員判斷依據。此方式：
- 無法在不部署新版 Rules 的情況下新增管理員
- email 若因 Google 帳號安全問題被篡改，攻擊者即可取得完整管理員權限
- 無法審計「哪些管理操作被誰執行」

**建議修正**：使用 Firebase Custom Claims 或 Firestore 中的 `admins` 集合動態管理管理員名單。

---

### 2.3 ⚡ 效能風險：GAS 每次請求均調用 Firestore REST API

**描述**：`firebase_handler.gs` 中每個請求（包括冪等性檢查、訂單狀態更新、階段標記）都對 Firestore REST API 發起獨立的 HTTP 請求（`UrlFetchApp.fetch`）。一筆完整的付款成功流程可能觸發 3-5 次獨立的 Firestore 請求。GAS 本身免費方案的執行時間上限為 6 分鐘，且 `UrlFetchApp` 有每日配額限制，在高流量情境下（如促銷活動）可能觸發 Google 的速率限制。

**建議修正**：若可能，引入 Batch Write（`v1/documents:batchWrite`）將多次更新合併為單一 API 請求。

---

### 2.4 🎯 第三方依賴風險：GAS Web App URL 硬編碼於前端

**描述**：`card-order.html` Line 768 與 `js/api.js` 中均直接硬編碼了 GAS Web App 的 URL（`/macros/s/.../exec`）。若未來 GAS 需要重新部署（更換部署版本，URL 將隨之改變），所有相關前端頁面必須同步手動更新，否則整個金流系統將失效。目前此 URL 至少存在三處：`api.js`、`card-order.html`（inline JS）。

**建議修正**：統一所有 API 端點至 `js/api.js` 的 `ENDPOINTS` 物件，`card-order.html` 中移除 inline 的直接呼叫，改用 `API` 或 `ENDPOINTS.FIREBASE_HANDLER`。

---

### 2.5 🔒 Firestore Rules：`members` 集合可被任意前端讀取

**描述**：`firestore.rules` 中 `members/{docId}` 的規則為 `allow read: if true`，這意味著任何人都可以透過 Firestore 客戶端查詢特定電話號碼的會員資訊（包含名稱、Email、LINE 名稱、常用地址等）。這構成隱私洩露風險。

**建議修正**：將 `members` 的讀取權限限制為 Firebase Auth 已登入用戶讀取自己的資料（`request.auth.uid == resource.data.uid`），或至少限制 `list` 操作。

---

## 3. 可優化建議 (General Optimization)

### 3.1 技術層面

#### 3.1.1 GAS 後端：統一 `fetchFirestoreDocument` 與 `getFirestoreDocumentById`

目前 GAS 有兩個相似的查詢函數：
- `fetchFirestoreDocument(collection, field, value)` → 使用 `runQuery`（可查任意欄位）
- `getFirestoreDocumentById(collection, id)` → 使用 REST GET（直接 ID 查詢）

這兩個函數的回傳格式高度相似，但各自的欄位解析邏輯重複了約 30 行。建議抽取共用解析邏輯為 `parseFirestoreDocument(doc)` 函數，減少維護面。

#### 3.1.2 GAS 後端：Email 發送邏輯模板化

目前 `handleCardPayment` 和 `handleRepayOrder` 都複製了相同的「發送買家 Email + 管理員 Email」的 try/catch 結構。應抽取為 `sendOrderEmails(order, subject, htmlBody)` 函數。

#### 3.1.3 前端：消除跨頁重複的 Firebase 初始化

建議所有頁面統一引入 `js/firebase-services.js`，在頁面 `<head>` 中移除重複的 `firebase.initializeApp()`。`card-order.html` 是目前唯一的例外需優先對齊。

#### 3.1.4 `admin.html` 過於龐大（5,936 行）

目前 `admin.html` 包含所有分頁的 HTML 結構、CSS 和所有 JS 邏輯，是一個近 6,000 行、284KB 的超大型單頁檔案。建議：
- 短期：將各分頁的 JS 邏輯抽取至獨立 JS 文件（如 `js/admin-orders.js`、`js/admin-cardlinks.js`）
- 長期：考慮遷移至 Vite + Vue/React 的組件化架構

#### 3.1.5 Firestore 離線緩存機制

目前系統使用 `experimentalForceLongPolling: true` 以繞過廣告攔截器，但未啟用 Firestore 的離線持久化（`enablePersistence`）。啟用後可大幅提升頁面二次載入速度，減少 Firestore 讀取次數。

```javascript
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn('Firestore persistence failed:', err.code);
});
```

---

### 3.2 業務邏輯優化

#### 3.2.1 訂單狀態機應統一定義

目前 `payment_status` 的狀態值（`pending`、`paid`、`completed`）分散定義在 GAS、前端 JS、Firestore Rules 之中，沒有任何集中的「狀態機定義文件」。建議在 `docs/STATE_MACHINE.md` 中定義所有合法狀態及其轉換條件。

#### 3.2.2 連結訂單（card_orders）查詢效能

`loadCardOrders()` 每次都查詢前 100 筆，無分頁機制。當訂單量增加後，這將是一個明顯的效能問題。建議引入無限滾動或分頁按鈕（`startAfter` cursor-based pagination）。

#### 3.2.3 缺少訂單「作廢」功能

目前 Admin 後台可以刪除訂單，但缺少「作廢（Void）」狀態，刪除操作是不可逆的。建議新增 `payment_status: 'voided'` 狀態，作廢後訂單仍保留在資料庫中以供稽核。

---

## 4. UI 優化建議 (UI Improvements)

### 4.1 🎨 `card-order.html`：狀態反饋色彩層次不足

| 問題 | 描述 |
|------|------|
| 已付款階段樣式 | 「此階段已完成支付」的綠色文字（`text-[#6ea44c]`）與金額顯示同色，缺乏層次區分，用戶無法快速辨識哪些是金額、哪些是狀態 |
| 鎖定階段 | `opacity-50` 的模糊處理方式雖直觀，但沒有 `cursor: not-allowed` 的搭配提示，用戶點擊後沒有任何回應，體驗斷點明顯 |
| 建議 | 已付款階段使用 ✅ 圖示 + 灰色 Badge，鎖定階段加上 `cursor-not-allowed` 與 `pointer-events: none`，並加入簡短的 tooltip 說明 |

### 4.2 🎨 `admin.html`：狀態 Badge 色彩語義

目前 `getStatusBadge()` 函數根據 `status` 返回不同顏色的 Badge，但其色彩設計未完全符合通用語意：
- `pending`（待處理）使用黃色 — ✅ 正確
- `completed`（已完成）應使用藍色或深灰色（成功完結），而非多種顏色混用

建議依照「紅 = 錯誤/取消、黃 = 等待中、綠 = 進行中/成功、藍 = 已結案/完成」語意統一。

### 4.3 🎨 `admin.html`：大量資料表格缺乏視覺錨定

目前訂單列表表格在資料量多時，用戶容易迷失在密集的行列中。建議：
- 每隔一行加入 `background: #f9fafb` 的斑馬紋（Zebra Stripes），提高掃描效率
- 重要的搜尋輸入框應固定在表格上方不隨滾動消失（`position: sticky`）

### 4.4 🎨 `card-order.html` 底部 Sticky Bar 設計

目前底部的「本次應付金額 + 前往付款」按鈕欄使用陰影與白色背景，設計良好。但在較小螢幕（iPhone SE 等）上，此欄高度 `h-20`（80px）佔用了約 13% 的視口高度，且沒有 `safe-area-inset-bottom` 的 CSS 變數保護（目前使用的是 class `safe-area-pb`，需確認 CSS 中是否正確定義）。

### 4.5 🔤 字體系統建議

`admin.html` 使用系統預設的 `sans-serif` 字體，與 `card-order.html`（繼承 global.css 的 Inter 字體）不一致。建議為 admin.html 也引入 Inter 字體，維持視覺系統統一性。

---

## 5. UX 優化建議 (UX Enhancements)

### 5.1 🧭 可用性分析（Heuristic Evaluation）

#### 5.1.1 `card-order.html`：缺少「儲存/自動填寫」的視覺回饋

**問題**：`localStorage` 資料在頁面載入時自動帶入，但沒有任何視覺提示告知用戶「已為您自動帶入上次的資訊」。用戶若沒有注意，可能使用過期或錯誤的舊地址，卻不知道。

**建議**：在自動帶入後，於電話欄或姓名欄下方顯示一個短暫（3-4 秒）淡出的 Toast：「✅ 已自動帶入您的上次資訊」。

#### 5.1.2 `card-order.html`：表單驗證時機不理想

**問題**：目前驗證（必填項目檢查）僅在用戶點擊「前往付款」後才觸發，若有多個欄位未填寫，用戶需要來回滾動找到問題所在。

**建議**：
- 電話號碼欄位失焦（`blur`）後即時驗證格式（`/^09\d{8}$/`）
- 超商店號輸入 6 碼後自動觸發格式驗證
- 採用 `inline error message`（欄位下方紅字）而非 `KUI.alert()` 彈窗，避免中斷操作流程

#### 5.1.3 `denwa-form.html`：備用功能缺乏引導

**問題**：備註欄的 placeholder 在指引用戶填寫備用時段或需求，但欄位視覺層級過低（普通文字欄），對於代撥服務這種高決策成本的表單，用戶容易略過關鍵說明。

**建議**：在備註欄上方加入一個淡色的提示卡片（`info-callout`），說明「建議提供備用時段，提高預約成功率」，增加引導感。

---

### 5.2 🗺️ 使用者路徑（User Journey）

#### 5.2.1 結帳後的成功頁體驗

**問題**：ECPay 付款完成後，用戶被重定向至 `https://keicha-membership-system.web.app/index.html`（首頁），這是一個非常冷酷的體驗斷點。用戶付款完成後，迫切需要看到的是「訂單確認 + 下一步說明」，而不是首頁。

**建議**：建立一個 `payment-result.html` 成功頁面，顯示：
- ✅ 付款成功圖示（動畫）
- 訂單編號
- 預計處理時程
- LINE 官方帳號快速進入按鈕

#### 5.2.2 電話代撥服務（denwa-form.html）缺少進度追蹤頁

**問題**：客戶提交電話代撥申請後，除了 Email 通知外，沒有任何方式主動查詢目前預約狀態，只能等待 LINE 通知，被動等待感強烈。

**建議**：建立或擴充 `order.html` 以支援 `denwa_orders` 的查詢，讓客戶輸入訂單編號或電話號碼即可查看最新進度與賣家回覆。

#### 5.2.3 Admin 面板缺少搜尋跨標籤的能力

**問題**：目前搜尋功能僅限於當前所在的分頁（訂單列表只能搜尋訂單），若管理員需要「同時查找某位客戶在不同服務的所有訂單」（如抹茶訂單 + 電話代撥訂單），需要手動切換分頁查詢。

**建議**：在 Admin 頂部加入全站搜尋功能（搜尋電話/名稱），回傳跨集合的搜尋結果，並顯示訂單來源類型標籤（抹茶 / 代撥 / 刷卡）。

---

### 5.3 😊 情感設計與無障礙（Accessibility）

#### 5.3.1 錯誤提示缺乏同理心

**問題**：`KUI.alert("請填寫所有必傳欄位 (*)")` 類型的錯誤提示語言直白但缺乏情感關懷，且沒有明確指出是「哪個欄位」出問題。

**建議**：錯誤訊息改為更友善的措辭，並精確指向問題欄位：
- `"請填寫姓名，讓我們知道是誰要付款 😊"` → 過度設計，避免
- 適合：`"請補填：真實姓名、LINE 顯示名稱"` → 明確 + 溫和

#### 5.3.2 色彩無障礙（Color Accessibility）

品牌色 `#6ea44c`（抹茶綠）的對比度：
- 深色背景下（白色文字）：對比比例通過 WCAG AA（✅）
- 但用於灰色文字上的 active 狀態邊框（`border-[#6ea44c]` on `bg-gray-50`）的對比比例僅約 2.5:1，低於 WCAG AA 要求的 3:1，**對色弱用戶不友善**。

**建議**：選中狀態應加深品牌色至 `#5a8c3a` 或搭配 `box-shadow` 提升視覺對比，而非僅依賴邊框。

#### 5.3.3 缺少 `aria-label` 與語義化標籤

目前大量的 icon buttons（如 `刷新`、`詳情`、`刪除`）僅有 `title` 屬性，但螢幕閱讀器（Screen Reader）優先使用 `aria-label`。應在所有 icon-only 按鈕上補充 `aria-label`。

```html
<!-- 目前 -->
<button title="刷新"> ... </button>
<!-- 建議 -->
<button title="刷新" aria-label="重新載入連結訂單清單"> ... </button>
```

---

### 5.4 ⚡ 效能感受

#### 5.4.1 `admin.html` 初始載入：缺少骨架螢幕（Skeleton Screen）

**問題**：Admin 所有分頁在初次切入時，都先顯示一個小型 `.loader`（旋轉圓圈）而非佔位內容。在資料量多時，用戶面對的是一個空白頁面 + 轉圈圈的不確定感，無法判斷資料是正在加載還是發生錯誤。

**建議**：參考 `denwa-form.html` 已實施的 `.skeleton`（骨架屏）方式，為訂單列表表格生成佔位 Row（骨架列），讓「內容的空間」先出現，再被真實資料替換，大幅提升加載感受的流暢度。

#### 5.4.2 `card-order.html`：會員查詢 UX 改進

**問題**：點擊「會員自動帶入」後，Button 切換為旋轉圖示，但沒有明確的成功/失敗結果提示（除了 `KUI.alert` 的「查無會員資料」）。成功帶入後沒有視覺確認，用戶可能重複點擊或不確定是否生效。

**建議**：
- 查詢成功：Button 短暫顯示 `✅ 已帶入`（1.5 秒後恢復）
- 查詢失敗：Button 短暫顯示 `查無資料` 並以紅色背景提示
- 此模式可避免使用彈窗中斷用戶的填表流程

---

## 6. 優先級建議清單 (Priority List)

| 優先級 | 項目 | 類別 | 預估影響 | 難度 |
|:---:|------|:---:|:---:|:---:|
| 🔴 P0 | **修正 Admin 訂單狀態 Badge 顯示**（`completed` 未被映射至 `confirmed`） | Bug | 高 | 低 |
| 🔴 P0 | **重新付款 ECPay/PCHomePay 路由 fallthrough 問題** | Bug | 高 | 中 |
| 🔴 P1 | **建立付款成功頁面** `payment-result.html`（改善結帳後體驗斷點） | UX | 極高 | 中 |
| 🟡 P1 | **統一 `card-order.html` Firebase 初始化**至全域模組 | 技術 | 中 | 低 |
| 🟡 P1 | **`order_counters` Firestore 規則收緊** | 資安 | 中 | 低 |
| 🟡 P1 | **`members` 集合讀取權限加強** | 資安 | 高 | 低 |
| 🟡 P2 | **Admin 訂單列表分頁功能**（Cursor-based Pagination） | 效能 | 中 | 中 |
| 🟡 P2 | **Admin 骨架螢幕**取代轉圈載入 | UX/UI | 中 | 中 |
| 🟡 P2 | **表單 Inline 錯誤提示**取代彈窗 Alert | UX | 中 | 中 |
| 🟡 P2 | **GAS API URL 統一至 `js/api.js`**（消除多處硬編碼） | 技術 | 中 | 低 |
| 🔵 P3 | **自動帶入 Toast 通知**（告知用戶已帶入舊資料） | UX | 低 | 低 |
| 🔵 P3 | **新增訂單「作廢」狀態**，避免硬刪除 | 業務 | 低 | 中 |
| 🔵 P3 | **Admin 全站跨集合搜尋** | 功能 | 中 | 高 |
| 🔵 P3 | **Admin 管理員 Custom Claims**（取代 email 硬編碼） | 資安/擴展性 | 中 | 高 |
| 🔵 P3 | **`admin.html` 模組化拆分**（JS 抽取至獨立文件） | 技術債 | 低 | 高 |
| 🔵 P3 | **Firestore 離線持久化**（`enablePersistence()`） | 效能 | 低 | 低 |
| 🔵 P3 | **所有 ariaLabel 補充**（無障礙合規） | 無障礙 | 低 | 低 |

---

> **報告結語**：KEICHA 系統在功能完整性上已達到可運作的商業標準，且在近期的代碼重構（全域 CSS/JS 模組化）方向正確。目前最迫切的短期改善項目在於：修正兩個影響付款流程的 Bug（P0 項目）以及補強資安弱點（P1 資安項目）。中期建議聚焦在用戶旅程的末端補完（付款成功頁）和管理員操作效率（骨架螢幕、分頁）。長期架構重點則是將 `admin.html` 的龐大代碼庫模組化，為未來功能擴展奠定基礎。

---

*報告由 Antigravity AI Engineering Agent 生成 — 2026-03-04*
