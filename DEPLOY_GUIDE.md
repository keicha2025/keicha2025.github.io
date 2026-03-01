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

## 1️⃣ 第一階段：本地測試與部署到 Firebase (測試預覽用)

根據我們專案的規範，**只要是測試與修改中的確認，請一律使用 Firebase Hosting 進行預覽，切勿直接 push 上 GitHub**。

### 🌱 操作指令：
若要同時建置 Jekyll Site 內容並推送到 Firebase Hosting，可以直接使用專案內建的腳本（此腳本會自動負責編譯並推送到 `keicha-membership-system` 專案）：

```bash
zsh sync.sh
```

> **💡 解析 `sync.sh` 裡面的動作：**
> 1. `jekyll build` - 將目前的 HTML / MD 建置到 `_site` 目錄。
> 2. `firebase deploy --only hosting` - 將 `_site` 裡面的內容打包上傳至 Firebase 供即時預覽。

**測試網址**：[https://keicha-membership-system.web.app/](https://keicha-membership-system.web.app/)

---

## 2️⃣ 第二階段：正式發布到 GitHub (Production 環境)

當在 Firebase 上測試完成，確定所有功能與 UI（完全遵循 `DESIGN_SYSTEM.md`）都沒有問題，且經過手動確認後，這時才能將變更發布到 GitHub 成為正式版本供實際消費者存取。

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

## 🛑 常見的防呆錯誤與原則

1. **嚴禁未經測試就推上 Github**：任何細微的修改，即使是修一個拼字錯誤，都請先跑一次 `zsh sync.sh` 用 Firebase 測試！
2. **忘記填寫 CHANGELOG.md**：為了團隊日後的追蹤，即使是很小幅度的變更，也建議要妥善記錄。
3. **找不到 Firebase 指令**：如果出現 `firebase: command not found`，請確認全域是否有正確安裝 CLI：`npm install -g firebase-tools`。
