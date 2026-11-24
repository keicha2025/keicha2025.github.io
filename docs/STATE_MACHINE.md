# KEICHA 訂單狀態機定義 (Order State Machine)

本文檔統一描述 KEICHA 系統中各類訂單（ Matcha, Denwa, Card Orders）的合法狀態、意義及其轉換條件。

## 1. 抹茶代購訂單 (`orders`)

抹茶訂單主要追蹤購買至出貨的生命週期。

| 狀態 (Status) | 中文顯示 | 意義 | 下一步轉換 (Next Allowed) |
|--------------|---------|-------|------------------------|
| `pending` | 待處理 | 訂單已建立，尚未確認匯款或尚未採購 | `processing`, `confirmed`, `cancelled` |
| `processing` | 處理中 | 已審核，商品正在採購/空運中 | `confirmed`, `shipped`, `cancelled` |
| `confirmed` | 已確認 | 商品已備齊，準備包裝出貨 | `shipped`, `completed`, `cancelled` |
| `shipped` | 已出貨 | 已交寄給物流業者，等待買家取貨 | `completed`, `cancelled` (特殊情況) |
| `completed` | 已完成 | 買家已取貨，交易結束 | 無 |
| `cancelled` | 已取消 | 買家取消或缺貨取消 | 無 |
| `voided` | 已作廢 | （保留供未來擴充）管理員標記無效 | 無 |

---

## 2. 專屬連結刷卡訂單 (`card_orders`)

Card Orders 的狀態主要定義為 `payment_status`。

| 狀態 (Payment Status) | 中文顯示 | 意義 | 下一步轉換 (Next Allowed) |
|---------------------|---------|-------|------------------------|
| `pending` | 待處理 | 訂單建立，尚未完成支付 | `paid`, `cancelled` |
| `paid` | 已確認 | 已透過金流服務完成支付 | `completed`, `cancelled` (退款) |
| `completed` | 已完成 | 支付完成且服務/商品已交付 | 無 |
| `cancelled` | 已取消 | 付款逾期、失敗或買家放棄 | 無 |
| `voided` | 已作廢 | （供未來擴充）測試單或異常單 | 無 |

---

## 3. 電話代撥服務訂單 (`denwa_orders`)

結合服務排程與付款兩階段的特殊狀態。

| 狀態 (Status) | 中文顯示 | 意義 | 下一步轉換 (Next Allowed) |
|--------------|---------|-------|------------------------|
| `pending` | 待處理 | 表單提交，管理員尚未報價/確認 | `quoted`, `cancelled` |
| `quoted` | 已報價 | 已確認可執行並報價，等待付款 | `paid`, `cancelled` |
| `paid` | 已確認 | 客戶已付款，等待執行代撥 | `processing`, `completed`, `cancelled` |
| `processing` | 處理中 | 正在進行代撥作業 | `completed`, `failed` |
| `completed` | 已完成 | 代撥成功並已回報結果 | 無 |
| `failed` | 失敗 | 代撥失敗（如無位、無接聽） | `cancelled` (視為退款) |
| `cancelled` | 已取消 | 客戶放棄或無法執行 | 無 |

---

## 4. 狀態機轉換規則 (Transition Rules)

設計原則與檢核：
1. **單向推進**：一般情況下訂單狀態應向前推進，除非發生退貨或退款才可進入 `cancelled`。
2. **只允許合法轉換**：系統（尤其是 GAS 後端與 Admin UI）在改變狀態時，應對照上表驗證來源狀態是否合法。
3. **已付款防護**：若 `payment_status` 為 `paid` 或 `completed`，不得再次觸發 ECPay 或 PCHomePay 之付款連結產生流程。
