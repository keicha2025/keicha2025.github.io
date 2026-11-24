# KEICHA 開發與部署指南

| 推送分支 | Firebase Hosting 測試站 | GitHub Pages 正式站 |
| --- | --- | --- |
| `main` | 自動部署 | 自動部署 |
| 其他分支 | 自動部署 | — |

- 正式站 [GitHub Pages](https://keicha2025.github.io/)
- 測試站 [Firebase Hosting](https://keicha-membership-system.web.app/)
- 工作流程 [Keicha Automated Deployment](https://github.com/keicha2025/keicha2025.github.io/actions/workflows/deploy.yml)

Firebase 測試站部署使用 Hosting 的 `live` 頻道。各分支推送共用同一個測試站網址。

## 每輪變更的發布步驟

1. 核對 Git 工作區、遠端與分支狀態，執行 `bundle exec jekyll build`。介面變更依 [設計規範](DESIGN_SYSTEM.md) 在本機或測試站驗證。
2. 在 `CHANGELOG.md` 末尾新增對應的發布紀錄。以技術英文描述變更，最後附上一至兩句中文摘要，保留既有紀錄。
3. 加入本輪相關檔案並提交，在 `main` 執行 `git push origin main`。
4. 在 Actions 選取該提交的工作流程，確認建置、`Deploy to Firebase Beta` 與 `Deploy to GitHub Production` 的結果。也可以用 GitHub CLI 追蹤。

   ```bash
   gh run list --workflow deploy.yml --commit "$(git rev-parse HEAD)"
   gh run watch <RUN_ID> --exit-status
   ```

5. 開啟測試站和正式站，檢查本次改動已生效，並確認本機與遠端 `main` 指向同一提交。工作流程排隊、啟動或建置成功時，仍須等部署工作完成並核對網站。

## 重跑與手動發布

失敗時查看對應工作日誌並修復原因。可以在原執行紀錄補跑失敗的工作，或在 `main` 手動選擇需要補跑的環境。

```bash
gh workflow run deploy.yml --ref main --field deploy_target=github_prod
```

在 GitHub 網頁可到 **Actions → Keicha Automated Deployment → Run workflow**，選擇 `main` 與 `github_prod`。可選目標還有 `firebase_beta` 和 `both`。補跑同一次發布沿用原變更日誌。發布新的變更時新增一筆紀錄。

## 部署設定

- GitHub Pages 在 **Settings → Pages → Build and deployment** 使用 **GitHub Actions**。
- Firebase Hosting 使用 GitHub 儲存庫的 Actions secret `FIREBASE_SERVICE_ACCOUNT_KEICHA_MEMBERSHIP_SYSTEM`。需要配置或輪替時，在 Firebase 專案設定的服務帳戶取得對應憑證，並在 **Settings → Secrets and variables → Actions** 更新。
