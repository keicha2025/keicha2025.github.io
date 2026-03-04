# KEICHA 網頁原生組件汰換診斷報告

> **報告對象**：前端開發團隊  
> **診斷動機**：優化品牌一致性、解決原生組件 UX 斷點、提升跨裝置體驗  
> **分析範圍**：全站原生 HTML 組件及 JavaScript 阻塞式對話框  

---

## 第一部分：原生組件分布清單 (Discovery List)

經掃描掃描全站程式碼，目前系統中原生組件的分布情況如下：

### 1. 瀏覽器對話框 (Native Dialogs)
| 組件類型 | 使用次數 | 主要分布頁面 | 狀態 |
| :--- | :--- | :--- | :--- |
| `alert()` | 8+ | `denwa-form.html`, `js/checkout_core.js` | 🔴 待汰換 |
| `confirm()` | 3 | `js/checkout_core.js` (舊代碼段) | 🔴 待汰換 |
| `prompt()` | 0 | - | ✅ 已清理 |
| `KUI.alert()` | 100+ | `admin.html`, `card-order.html` | ✅ 已標準化 |

### 2. 選擇器組件 (Select & Dropdown)
| 所在頁面 | 組件用途 | 目前實現方式 | 狀態 |
| :--- | :--- | :--- | :--- |
| `denwa-form.html` | 服務時段選擇 | `<select class="form-input">` | 🟡 基礎樣式 |
| `admin.html` | 訂單/商品狀態切換 | `<select class="admin-select">` | 🟡 基礎樣式 |

### 3. 檔案上傳處 (File Uploaders)
| 所在頁面 | 組件用途 | 目前實現方式 | 狀態 |
| :--- | :--- | :--- | :--- |
| `admin.html` | Excel 匯入、商品圖上傳 | `display: none` 隱藏 + 按鈕觸發 | 🟢 優化中 |

### 4. 基礎輸入與按鈕 (Inputs & Buttons)
| 類型 | 分布 | 統一化程度 | 狀態 |
| :--- | :--- | :--- | :--- |
| `Buttons` | 全站 | 80% 已使用 `.btn` 類別 | 🟢 良好 |
| `Text Inputs` | 全站 | 60% 已使用 `.admin-input` 類別 | 🟡 尚有遺漏 |

---

## 第二部分：UX 痛點分析 (UX Pain Points)

### 1. 🛑 執行緒阻塞與 UX 斷點
原生 `alert()` 和 `confirm()` 會完全暫停瀏覽器的 JS 執行與頁面渲染。在現代 Web 應用中，這會造成「系統當機」的錯覺。此外，原生彈窗的外觀（由作業系統決定）與 KEICHA 的抹茶綠品牌視覺格格不入，嚴重損害品牌的高級感。

### 2. 📱 行動端互動災難
原生 `<select>` 在 iOS 與 Android 上的表現截然不同（iOS 下拉選單會從底部滑出大佔位的選擇器），這會導致管理員在行動裝置操作 Admin 面板時，視覺焦點被強制切換，且無法在下拉選單中加入搜尋或縮圖功能。

### 3. 🧩 組件狀態不透明
原生組件難以實現「載入中 (Loading)」、「成功 (Success Check)」或「微互動動畫 (Micro-interactions)」。例如：當管理員點擊「儲存」時，原生按鈕無法輕鬆在內部顯示旋轉圖示。

---

## 第三部分：組件轉換技術提案 (Technical Migration Proposal)

### 1. 對話框：從「同步」到「非同步 (Promise-based)」
目前的 `KUI` 系統已具備基礎，但需統一全站導入路徑。

**【重構範例：刪除確認】**
```javascript
// ❌ 原生方式：會阻塞執行，樣式醜陋
if (confirm('確定要刪除嗎？')) {
    doDelete();
}

// ✅ KUI 方式 (推薦)：具備品牌色、非阻塞、支援 async/await
const confirmed = await KUI.confirm('確定要刪除這筆資料嗎？此操作無法復原。');
if (confirmed) {
    await doDelete();
    KUI.toast('已成功刪除');
}
```

### 2. 選擇器：封裝自定義 Dropdown 組件
建議設計一個 `KEICHA-Select` 組件，取代原生 `<select>`。

**【結構提案：Vanilla JS 實現】**
```html
<div class="k-select-container">
    <div class="k-select-trigger">
        <span class="selected-text">請選擇狀態</span>
        <span class="material-symbols-rounded">expand_more</span>
    </div>
    <div class="k-select-options">
        <div class="k-option" data-value="pending">待處理</div>
        <div class="k-option" data-value="completed">已完成</div>
    </div>
</div>
```
*優點：可完全透過 CSS 控制圓角 (`var(--r-md)`) 與陰影，並在選項中加入色標、圖示。*

### 3. 檔案上傳：進化為「拖放互動區」
目前 `admin.html` 已隱藏原生 input，下一步應加強反饋。

**【技術強化建議】**
- **Drag Detection**：當檔案拖曳至容器上方時，改變邊框顏色為 `#6ea44c` (品牌綠)。
- **File Preview**：圖片上傳後直接顯示縮圖，而非僅顯示檔名。
- **Progress Slot**：利用 `xhr.upload.onprogress` 驅動進度條。

---

## 第四部分：一致性優化建議 (Consistency Suggestions)

為了確保新組件完美對齊 `DESIGN_SYSTEM.md`，請依循以下規格：

### 1. 對話框視覺規格 (Modal Spec)
- **遮罩 (Overlay)**：`rgba(0, 0, 0, 0.4)`，背景附帶 `backdrop-filter: blur(4px)`。
- **進入動畫**：`transform: scale(0.95) -> 1.0`, `opacity: 0 -> 1` (200ms cubic-bezier)。
- **圓角**：一律使用 `var(--r-lg)` (16px)。

### 2. 表單控制項規格 (Input Spec)
- **Focus 狀態**：`border-color: #6ea44c` + `box-shadow: 0 0 0 3px rgba(110, 164, 76, 0.1)`。
- **Placeholder**：統一使用 `#9ca3af` (Gray 400)。
- **字體**：中文優先選用「Zen Maru Gothic」, 英文 Inter。

### 3. 汰換優先序
1. **P0 (即刻)**：將 `denwa-form.html` 與 `checkout_core.js` 中的最後幾個 `alert()` 替換為 `KUI.alert()`。
2. **P1 (短期)**：為 `admin.html` 的「狀態切換」製作自定義 Dropdown。
3. **P2 (長期)**：將所有原生 `<input type="checkbox">` 封裝為組件庫。

---

*報告完畢。此報告旨在協助 KEICHA 專案從「可以用」走向「極致好用」。*
