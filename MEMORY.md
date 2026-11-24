# KEICHA 專案記憶

- 共用導覽和電話服務條款以 `details/summary` 處理基本開合。頁首模組補上點擊外部、Escape 與 Web Share，關閉 JavaScript 時仍能展開導覽及閱讀條款。
- 隱私條款由 Jekyll 從同一份 TSV 在建置時輸出到獨立頁和電話服務頁，避免二次請求或折疊區依載入時機算錯高度。
- KUI 的 `alert`、`confirm`、`prompt` 保持 Promise 介面。原生 `dialog` 管理焦點和 Escape，後來的對話框取代上一個時會結束上一個 Promise。管理後台及電話預約的下拉選項使用實際的 `select`，選項更新會直接反映在控制項上。
- 電話表單的半小時時段為建置時資料。Firestore 方案以 `template` 渲染到放有原生 radio 的欄位組。可用方案載入後才開放送出，表單通過瀏覽器驗證後才進入既有寫入流程，同一次送出只分配一次訂單流水號。
- 儲存庫的 Pages 建置來源為 GitHub Actions。`main` 推送會啟動同一份工作流程的 GitHub Pages 正式發布與 Firebase Hosting 測試站部署，兩個部署工作分別確認結果。
