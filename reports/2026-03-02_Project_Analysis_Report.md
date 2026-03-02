# 專案系統分析與優化建議報告（2026-03-02）

本報告基於近期的開發歷程、目錄重整、前端臭蟲（Bug）修復經驗，針對「Keicha Membership System」目前的系統架構進行全面盤點，列出潛在的系統隱患及優化建議。

---

## 1. 資訊安全與資料庫規則 (Security & Database Rules)

### 存在問題
目前的 `firestore.rules` 在非管理員寫入資料時，過度依賴寫死的客戶端權杖（如 `if request.resource.data.source_token == 'keicha_2025_web_auth'`）。
此種驗證方式在純前端網頁（HTML/JS）中是**絕對不安全**的。由於程式碼公開，任何人只要查看網頁原始碼或攔截封包，就能輕易取得這組字串，並利用它向資料庫寫入假訂單或修改會員資料。

### 優化建議
*   **短期處理**：為前台的所有使用者啟用 Firebase Anonymous Authentication（匿名登入）。讓客人取得一組不具名 UID 後，將資料寫入權限綁定在該 UID 身上。
*   **中長期建設**：導入 **Firebase App Check**，這能確保只有來自我們自己網域（`keicha-membership-system.web.app`）的真實瀏覽器請求可以存取 Firestore，自動阻擋惡意腳本（Bot）或 Postman 的不當呼叫。

---

## 2. 程式碼重複性與模組化 (Code Quality & Modularity)

### 存在問題
專案中缺乏集中的 CSS 與 JavaScript 管理機制，導致高度的「程式碼重複」（Copy-Paste Programming）。
例如：幾乎所有需要輸入表單的頁面（`diy.html`, `card-order.html`, `admin_fast.html`）都重複擁有類似消除數字箭頭 (`appearance: textfield`) 與對焦框樣式 (`border-color`、`box-shadow`) 的 `<style>` 區塊。後台的訂單資料提取邏輯也在各種頁面與標籤卡內重複撰寫。

### 優化建議
*   **樣式表抽離**：將通用的 UI 樣式（如按鈕、輸入框、狀態膠囊、表單容器）抽離至單一的 `css/global.css`，讓所有頁面 `<link>` 引入，未來更改品牌色只需改一行代碼。
*   **共用邏輯抽象化**：將 Firebase 初始化、API 呼叫與常用的資料轉換函式提取為獨立的 `js/firebase-services.js` 與 `js/utils.js` 模組，大幅減少各頁面的程式碼行數與維護時間。

---

## 3. 資料結構對齊與向後相容性 (Data Consistency)

### 存在問題
如同我們在修復訂單追蹤頁面（`jyoukyou.html`）時所觀察到的，早期的「舊訂單或特定表單」（如舊版代撥或客製連結）資料結構並沒有嚴格區分「商品金額」與「運費」，也沒有確切的兩階段付款設計，導致在新版介面匯入舊資料時，經常需要額外撰寫 `fallback`（備用）邏輯，這會不斷增加前端渲染的複雜度。

### 優化建議
*   **執行資料庫正規化（Data Migration）**：撰寫一次性的腳本，跑遍 Firestore 現有的歷史訂單，為所有缺失 `baseAmount` 與 `shippingFee` 的舊訂單補上預設值（或是將舊的 `amount` 自動拆分補齊），讓資料格式達到 100% 統一。
*   **強化寫入層驗證**：未來的前端寫入動作不應依賴自由格式的 JavaScript Object，應在寫入層級或利用 Firestore 規則（要求特定欄位為必填資料）來防止劣質數據生成。

---

## 4. 部署工作流程自動化 (CI/CD Workflow)

### 存在問題
目前需要手動執行打包（`bundle exec jekyll build`）與推送（`firebase deploy`）的程序。如果參與開發的人員忘記依序執行指令就直接 Push GitHub，或是本地端設定有誤，容易導致線上環境版本與 GitHub 庫不同步，甚至引發線上災難。

### 優化建議
*   **導入 GitHub Actions 自動部署**：撰寫一組 `.github/workflows/deploy.yml` 腳本。未來您只要把程式碼推送到 GitHub 的 `main` 分支，GitHub 就會在雲端自動幫您編譯 Jekyll 網站並部署至 Firebase Hosting，徹底消除人工操作的失誤風險。

---

## 5. API 與第三方服務整合 (Third-party Integrations)

### 存在問題
系統內依賴了 Google Apps Script（用於 Gmail 與表單發信）及 PChomePay 串接。目前這些都是由前端直接 Call Script URL 或是仰賴頁面跳轉。前端如果直接承受所有第三方 API 的回應延遲，會導致載入時間過長。

### 優化建議
*   **中介層整合（Firebase Cloud Functions）**：將寄送通知信、建立 PChomePay 訂單的邏輯移至雲端函數。前端只需發送極輕量的請求給 Cloud Functions，這不僅能徹底藏匿所有第三方 API Key，還能加快前端結帳或送單的回應速度，大幅提升使用者體驗。

---

## 結論

Keicha 專案目前的產品思路與介面規劃已具備相當的完整性與商業價值。在此基礎上，下一步的關鍵**不再是增添新功能，而是「還技術債」**。優先將安全漏洞（`source_token`）、核心架構（全域 CSS/JS）與部署流程（GitHub Actions）完善，不僅可延長專案壽命，未來的迭代開發速度也會有規模化的大幅提升。
