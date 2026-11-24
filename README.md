# KEICHA 2025 網站

此 repository 是以 Jekyll 3.9.5 建置的靜態網站。網站目前使用 Firebase Authentication、Cloud Firestore 與 Firebase Hosting；部分表單通知及資料整合使用 Google Apps Script（GAS）。**目前沒有使用 Supabase**；README 舊有的 Supabase 整合、設定與安全建議已過時。

## 本機開發

需求：Ruby 與 Bundler。依照鎖定版本安裝相依套件並啟動 Jekyll：

```bash
bundle install
bundle exec jekyll serve
```

預設在 <http://127.0.0.1:4000> 預覽。建置靜態檔案可執行：

```bash
bundle exec jekyll build
```

輸出位於 `_site/`。`package.json` 僅列有 CSS parser 套件；一般 Jekyll 建置不需要 npm。若要安裝該 Node.js 相依套件，使用 `npm ci`。

## 專案用色

以首頁 `index.html` 的視覺為準，新增或調整頁面時沿用以下品牌與中性色，避免各頁自行引入不同色票：

| 基礎色 | 色碼 | 用途 |
| --- | --- | --- |
| 品牌綠 | `#6ea44c` | 主要按鈕與品牌強調色（`brandGreen`） |
| 白色 | `#ffffff` | 卡片、按鈕與反白文字 |
| 淺底色 | `#f9fafb` | 區塊背景（`gray-50`） |
| 邊框灰 | `#e5e7eb` | 分隔線與次要按鈕底色（`gray-200`） |
| 文字灰 | `#4b5563` | 一般內文（`gray-600`）；輔助與次要文字沿用既有 `gray-500`／`gray-700` |
| 深色 | `#1f2937` | 深色按鈕（`gray-800`） |

優先使用專案既有的 CSS 變數（如 `--brand-green`、`--gray-50` 至 `--gray-800`）及 Tailwind 對應色名。表格中的六色為基礎色，灰階細分與首頁局部色沿用既有樣式；品牌綠的 hover、透明度等狀態不另造新的品牌主色。

## 主要目錄與服務

### 訪客入口與服務

首頁導覽以顧客任務為主，主要入口如下：

- **抹茶代購**：`maccha-store.html` 瀏覽品牌、商品與供貨狀態，購物車結帳；`contact.html` 聯繫客服詢問其他品項。
- **日本電話代撥**：`denwa.html` 查看服務內容、費用與條款；`denwa-form.html` 線上提出預約需求，也可透過 LINE 詢問。
- **下單與付款**：`user-guide.html` 查看訂購方式；`diy.html` 填寫店到店貨到付款訂單；首頁及 `denwa.html` 提供 PChomePay 付款入口（電話代撥的預付款、基本費與補款／尾款入口列於服務頁）。
- **訂單追蹤**：`jyoukyou.html` 以訂單編號或電話查詢抹茶訂單、電話代撥訂單及其他付款訂單；結果可進入 `order.html` 查看訂單。
- **聯絡與資訊**：`contact.html` 連接 LINE 官方客服；`privacy.html` 提供隱私權條款。

### 管理與系統頁面

- `admin.html`（線上入口 `/admin`）：管理員以 Google 登入後使用的管理後台。頁籤包含訂單列表、電話代撥預約、品牌與商品、電話服務方案、物流管道與運費規則、快速結帳賣場、刷卡連結及其訂單、資料備份／還原與系統維護；另有測試區可開啟前台頁面及測試郵件樣式。此頁使用 Firebase Authentication 與 Cloud Firestore，屬於管理入口，不是一般訪客的服務入口。
- `card-order.html`、`fast.html`、`form-result.html`、`denwa-result.html`、`denwa-pay.html`、`fast-diy-result.html`：依訂單連結或提交流程使用的結帳、付款及結果頁，通常由網站流程導入，不是主要導覽項目。
- `shop/`：另一組商店前端頁面與程式。

### 專案目錄與服務實作

- `_layouts/`、`_includes/`：共用頁面版型、頁首導覽、頁尾與聯絡區塊。
- `assets/`、`images/`、`css/`、`js/`：圖片、樣式及前端功能模組（包含 Firebase 初始化、API 與結帳共用程式）。
- `gas/`：Google Apps Script 後端程式，處理表單／通知等整合。
- `firebase.json`、`firestore.rules`：Firebase Hosting 與 Cloud Firestore 設定；前台商店、訂單、會員、訂單追蹤及管理功能使用 Firestore，管理功能另使用 Firebase Authentication。
- `docs/`：操作、維護與部署文件；`reports/`：專案分析與稽核報告；`archive/`：舊版頁面留存；`demo/`：介面示範頁。

## 發布流程

每輪變更驗證通過後，追加 `CHANGELOG.md`、提交並推送至 `origin/main`。每次推送 `main` 都會觸發 GitHub Actions，同時部署 GitHub Pages 正式站與 Firebase Hosting 測試站。追蹤該提交的部署工作至結束，並檢查兩個公開網址的變更。詳細完成條件及補跑方式見 [專案工作指示](AGENTS.md) 和 [部署指南](docs/DEPLOY_GUIDE.md)。

## 後端與部署

本機瀏覽靜態頁面不需要後端憑證。使用登入、Firestore 或表單通知等功能時，頁面會依功能連接 Firebase 或 GAS。部署相關流程及所需設定請參考 [`docs/DEPLOY_GUIDE.md`](docs/DEPLOY_GUIDE.md)。
