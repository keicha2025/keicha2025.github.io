# Changelog

## 2026-11-24

- Replace custom navigation, disclosure, dialog, and select behavior with native HTML controls.
- Render shared privacy clauses during the Jekyll build and use a native HTML template for Firestore-backed reservation plans.
- Use native reservation validation and allocate one order sequence number per submission.
- Document the automatic production and beta deployments on pushes to `main`, including verification of both public endpoints.

共用導覽、電話服務與預約表單改用原生 HTML 控制項，兩處隱私條款共用建置資料。每輪變更驗證後推送 `main`，並確認正式站與測試站的部署結果。

## 2026-11-24 — GitHub Pages deployment history

- Associate the production deployment job with the `github-pages` environment and publish the Pages URL in its deployment record.
- Verify the latest successful environment deployment against the released commit.

正式部署完成後，GitHub 的 `github-pages` 環境會顯示本次發布紀錄。
