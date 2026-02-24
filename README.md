# KEICHA 2025 - Supabase Integrated E-commerce Site

這是一個整合了 Supabase 作為後端的靜態電商網站，使用 Jekyll 構建。

## 🚀 快速開始

1. **本地開發**
   ```bash
   bundle exec jekyll serve
   ```
   存取 `http://127.0.0.1:4000` 即可預覽網站。

2. **後端設定**
   請參考 `supabase/SETUP_GUIDE.md` 進行 Supabase 與 Google Apps Script 的設定。

## 📂 資料夾結構

- `_layouts/`: 網站通用版型
- `assets/`: 靜態資源 (圖片、樣式)
- `js/`: 
  - `supabase-api.js`: 與 Supabase 互動的核心 API 用戶端
- `gas/`: Google Apps Script 代碼 (用於發送 Email Webhook)
- `supabase/`: 
  - `schema.sql`: 資料庫結構
  - `test_data.sql`: 測試資料
  - `SETUP_GUIDE.md`: 完整的設定指引

## 🛠 已完成的整合頁面

- [x] **快速結帳 (fast.html)** 
- [x] **管理後台 (admin_fast.html)** 
- [x] **電話代撥預約 (denwa-form.html)**
- [x] **抹茶商店 (maccha-store.html)**
- [x] **自填單結帳 (diy.html)**

## 🛡 安全建議

- 正式上線前，請確保在 Supabase Dashboard 啟用 **Row Level Security (RLS)** 並設定正確的政策。
- `supabase-api.js` 中使用的是 `anon public key`，這是可以公開在前端的。請勿將 `service_role key` 放在前端。

---

**Last Updated:** 2026-02-09
