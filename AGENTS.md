# KEICHA 專案工作指示

- 保留 Jekyll 入口及既有訂單、付款、物流與 Firebase 資料契約。先檢查工作區、README 和相關頁面，完成後只提交本輪變更。
- 靜態共用結構優先使用 Jekyll layout、include 和資料檔。折疊、對話框、選項和表單驗證優先使用原生 HTML。以 CSS 處理排列與互動狀態，JavaScript 處理資料載入及瀏覽器 API。
- 執行 Jekyll 建置並檢查實際產出的頁面。互動變更至少驗證鍵盤路徑和適用的桌面、手機版面。使用測試資料驗證訂單流程，避免寫入正式訂單。
- 隱私權條款統一維護在 `_data/privacy.tsv`，依檔案列順序顯示。內容會作為純文字輸出，保留 `<br>` 換行。

## 部署完成條件

- 每輪變更驗證通過後，先在 `CHANGELOG.md` 末尾追加發布紀錄，只提交本輪相關檔案，並推送至 `origin/main`。使用者明確要求僅本機、唯讀或暫停發布時，依該次指示。
- 推送 `main` 會啟動 `Keicha Automated Deployment`，同時部署 GitHub Pages 正式站與 Firebase Hosting 測試站。正常流程由推送觸發。重跑或手動發布方式見 [部署指南](docs/DEPLOY_GUIDE.md)。
- 追蹤對應提交的建置和部署工作至結束，並以公開網址確認本輪變更已生效。正式發布也須確認 GitHub 的 `github-pages` 環境有該提交的成功紀錄。若部署失敗，先排查可修復問題並重試，回報時分別列出兩個環境的結果。
