# KEICHA 系統資料庫結構說明 (Firestore)

本文檔記錄了 KEICHA 專案在 Firebase Firestore 中的集合 (Collections) 結構與欄位定義。

---

## 1. 抹茶商店相關 (Matcha Shop)

### `matcha_brands` - 品牌管理
用於管理前端顯示的品牌類別。
- **ID**: 品牌名稱 (例如 `一保堂`) 或隨機生成
- `name` (String): 品牌顯示名稱
- `status` (String): `active` (啟用) | `inactive` (停用)
- `display_order` (Number): 排序權重 (越小越靠前)
- `hidden` (Boolean): 是否在前端隱藏
- `created_at` (Timestamp): 建立時間

### `matcha_products` - 商品管理
儲存所有抹茶代購商品的詳細資訊。
- **ID**: 隨機生成
- `brand_id` (String): 隸屬品牌 ID (對應 `matcha_brands`)
- `name` (String): 商品名稱
- `spec` (String): 規格描述 (如 `30g罐裝`, `20g紙盒裝`)
- `price` (Number): 單價
- `price_multi` (Number): 同品牌商品兩件以上的優待單價
- `status` (String): `available` (有貨) | `out-of-stock` (缺貨)
- `stock` (Number): 庫存數量
- `max_limit` (Number): 單筆訂單購買上限
- `tag` (String): 特殊標籤 (如 `現貨`, `期間限定`)
- `note` (String): 商品簡介或備註
- `image_url` (String): 商品圖片連結
- `hidden` (Boolean): 是否隱藏
- `category` (String): 分類名稱 (如 `日本代購`)
- `created_at` (Timestamp)

### `orders` - 訂單管理
存儲來自抹茶商店 (含 DIY 自填單) 的訂單。
- **ID**: 隨機生成
- `order_id` (String): 可讀編號 (若無則使用 ID)
- `name` (String): 收件人真实姓名
- `phone` (String): 聯絡電話
- `email` (String): 電子信箱
- `line_name` (String): LINE 顯示名稱
- `items_text` (String): 商品內容純文字總覽
- `items` (Array): `[{ name, price, qty }]` 詳細品項列表
- `subtotal` (Number): 商品小計
- `shipping_fee` (Number): 運費
- `total` (Number): 應付總額
- `status` (String): `待處理` | `已確認` | `處理中` | `已出貨` | `已完成` | `已取消`
- `logistics_type` (String): `7-11` | `全家` | `宅配`
- `store_id` (String): 6 碼超商店號 (超取專用)
- `store_note` (String): 超商門市名稱 (超取專用)
- `shipping_address` (String): 完整收件地址 (宅配專用)
- `payment_method` (String): `cod` (貨到付款) | `transfer` (銀行轉帳)
- `seller_note` (String): 賣家內部備註
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

---

## 2. 電話代撥相關 (Denwa Service)

### `denwa_plans` - 服務方案
管理電話代撥的計費方案。
- **ID**: 隨機生成
- `name` (String): 方案名稱 (如 `基本方案`)
- `price` (Number): 方案價格
- `desc` (String): 方案內容描述
- `status` (String): `ON` | `OFF`
- `link` (String): 付款連結 (綠界/第三方支付)
- `display_order` (Number): 排序
- `created_at` (Timestamp)

### `denwa_orders` - 預約訂單
儲存客戶送出的電話代撥預約需求。
- **ID**: 隨機生成
- `order_id` (String): 預約編號 (格式: `denwa-XXXXXXXX`)
- `customer_name` (String): 填單人姓名
- `line_name` (String): LINE 聯繫資訊
- `phone` (String): 聯絡電話
- `merchant_name` (String): 欲預約的日本商家/餐廳名稱
- `service_date` (String): 預約日期 (格式 `YYYY-MM-DD`)
- `service_time` (String): 預約時間 (格式 `HH:mm`)
- `adult_count` (Number): 大人人數
- `child_count` (Number): 小孩人數
- `total_count` (Number): 總人數
- `booking_name` (String): 提供給店家的留名 (英文/片假名)
- `plan_name` (String): 選購方案名稱
- `note` (String): 客戶特殊要求備註
- `contact_in_japan` (String): 在日期間的聯繫方式 (如飯店名)
- `status` (String): `待處理` | `已確認` | `預約成功` | `已取消`
- `public_reply` (String): 給客戶的公開進度回覆
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

---

## 3. 系統配置與會員 (System & Members)

### `shipping_rules` - 運費規則設定
- **ID**: 隨機生成
- `category` (String): 規則組別 (如 `自填單`)
- `method` (String): 物流渠道 (如 `7-11 店到店`, `宅配`)
- `base` (Number): 基礎運費
- `t1`, `f1` (Number): 滿額級距 1 與對應運費
- `t2`, `f2` (Number): 滿額級距 2 與對應運費
- `t3`, `f3` (Number): 滿額級距 3 (通常為免運門檻)

### `fast_checkout_config` - 快速結帳配置
- **ID**: `default` (單一文檔)
- `status` (String): `開啟` | `關閉`
- `amount` (Number): 快速結帳的預設總金額
- `items_text` (String): 顯示在結帳頁的商品內容說明
- `enable_711`, `enable_fami`, `enable_home`: 各物流開關
- `enable_cod`, `enable_linepay`: 各付款開關

### `members` - 會員資料 (收件資訊填寫優化)
用於「電話號碼自動帶入」功能的資料來源。
- **ID**: 隨機生成 或 電話號碼
- `phone` (String): 會員手機 (主要查詢鍵)
- `name` (String): 真實姓名
- `email` (String): 常用的電子信箱
- `line_name` (String): LINE 紀錄名稱
- `store_711`, `store_711_note`: 預設 7-11 店號與門市
- `store_fami`, `store_fami_note`: 預設全家店號與門市
- `shipping_address` (String): 預設宅配地址
- `created_at` (Timestamp)
