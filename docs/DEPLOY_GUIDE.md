# 🚀 KEICHA 開發與部署指南 (Deployment Guide)

這份文件說明如何使用終端機 (Terminal) 執行本地環境的建置、即時預覽，以及將更新部署至 Firebase (測試用) 與 GitHub (正式上線)。

---

## 🧭 環境預備

執行以下指令前，確保：
1. 目錄已切換至專案資料夾：
   ```bash
   cd /Users/jing/Downloads/keicha2025.github.io
   ```
2. 需要的環境已正確安裝 (例如 `firebase-tools`, `jekyll` 如果有需要)。

---

## 1️⃣ 第一階段：測試與部署到 Firebase (Beta 預覽用)

現在專案已導入 **GitHub Actions 自動化部署**。建議將測試中的功能推送到 `develop` 或其功能分支，系統會自動將變更部署至 Firebase Hosting 供即時預覽。

### 🕊️ 自動化流程：
當您執行 `git push` 時，GitHub 就會自動接手：
1. **觸發頻率**：每次推送任一分支代碼至 GitHub 儲存庫。
2. **動作內容**：
   - 自動在雲端執行 `jekyll build` 建置網站。
   - 自動將建置後的 `_site` 部署到 Firebase Hosting Beta 環境。
3. **網址確認**：[https://keicha-membership-system.web.app/](https://keicha-membership-system.web.app/)

> **💡 注意事項**：
> 如果您是第一次使用此自動化流程，請確保 GitHub 儲存庫中已設定 `FIREBASE_SERVICE_ACCOUNT_KEICHA_MEMBERSHIP_SYSTEM` 金鑰。詳見下方「GitHub Actions 常見設定」章節。

---

## 2️⃣ 第二階段：正式發布到 GitHub (Production 環境)

當在 Firebase 上測試完成，確定所有功能與 UI 都符合 `DESIGN_SYSTEM.md` 無誤後，這時才能啟動正式版建置。

根據您的需求，**正式版預設為手動觸發**，讓您有 100% 的主導權。

### 🚀 觸發方式 (Trigger Methods)：
當您準備好要升級至正式版時，可以選擇以下任一方式觸發：

#### **方法 A：使用 GitHub 網頁 (Web UI)**
1. 開啟 [GitHub 儲存庫頁面](https://github.com/keicha2025/keicha2025.github.io/actions)。
2. 點選左側清單中的「**Keicha Automated Deployment**」。
3. 點選右側「**Run workflow**」按鈕。
4. 在選單中確保 `Deploy Environment` 選擇為 **github_prod**，然後點擊「Run workflow」。

#### **方法 B：使用終端機指令 (GitHub CLI)**
如果您已安裝 [GitHub CLI (`gh`)](https://cli.github.com/) 工具，可直接在本地執行：
```bash
# 觸發正式環境部署
gh workflow run deploy.yml --field deploy_target=github_prod

# 查看部署進度
gh run list --workflow deploy.yml --limit 1
```
> **💡 小提示**：如果您的 Mac 尚未安裝 `gh`，可以使用 `brew install gh` 進行安裝。
5. 等待流程跑完，您的正式網站就會同步更新。

**正式版網址**：[https://keicha2025.github.io/](https://keicha2025.github.io/)

### 🚨 部署前必做事項：更新變更日誌
在準備 Push 到遠端 (GitHub) 前，**必須** 更新根目錄下的 `CHANGELOG.md`：
- 在檔案最後面追加最新的修改內容（請勿覆蓋或刪除舊紀錄）。
- 主內容使用技術英文，結尾附上 1-2 句中文重點摘要。

### 🌲 第一步：檢視變更與加入追蹤

查看目前有哪些檔案被更動過：
```bash
git status
```

把所有的變更都加入這次的更新包中：
```bash
git add .
```

### 📝 第二步：提交變更紀錄

為這次的變更寫下一段簡短的說明（註明修了什麼、新增了什麼），中英文皆可：
```bash
git commit -m "Update: 新增測試模組與修復管理員後台 UI bug"
```

### 🚀 第三步：推送到 GitHub 遠端與自動建置

最後，把檔案推送到 Github 上的預設分支 (`main`)：
```bash
git push origin main
```

一旦推送到 GitHub，GitHub Pages 的後台機制就會自動開始編譯並為你發布正式版本。

**正式版網址**：[https://keicha2025.github.io/](https://keicha2025.github.io/)

---

## 🛑 GitHub Actions 常見問題與安全性設定

為了讓自動部署正常運作，您需要設定以下安全金鑰 (Repository Secrets)：

1. **取得 Service Account 金鑰**：
   - 到 [Firebase 控制台](https://console.firebase.google.com/) -> 專案設定 -> 服務帳戶。
   - 點擊「產生新的私密金鑰 (JSON)」。
2. **設定到 GitHub**：
   - 到 GitHub 儲存庫 -> Settings -> Secrets and variables -> Actions。
   - 點擊「New repository secret」。
   - 名稱填入：`FIREBASE_SERVICE_ACCOUNT_KEICHA_MEMBERSHIP_SYSTEM`。
   - 內容貼入剛才下載的 JSON 全文。

---

## 📜 部署與版本歷史準則 (Changelog)

在啟動正式部署 (Production) 前，請務必按照規範：
1. 更新根目錄下的 `CHANGELOG.md`：
   - 將最新的修改內容追加至末尾。
   - 主內容使用技術英文，結尾附上 1-2 句中文摘要。
2. **每次正式推送或手動部署必須對應一個 Changelog 紀錄**，切勿合併多次更新。

---
*上次 CI/CD 流程驗證日期：2026-03-02 19:10*
