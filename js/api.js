/**
 * js/api.js
 * Centralized API management for KEICHA project.
 */

const ENDPOINTS = {
    // Current centralized handler (Used for notifications)
    FIREBASE_HANDLER: "https://script.google.com/macros/s/AKfycbxuhZcx8uKvrASAQy7ZEf3k979DT4b4qU6MK7Rhb8oiOir8QWCxlgmR4vYdticnxD0B/exec",
    // Legacy/Dedicated handlers (from git_backup)
    MATCHA: "https://script.google.com/macros/s/AKfycbxnxbcdCdxH2Qmuek5Up8BqTWeOLUcLR30jfUi0lMbMn5ocn9tY1f_c7yEyd9KSZ4Um/exec",
    CORE: "https://script.google.com/macros/s/AKfycbyUq36i64Z-JGcERE_rZOdphVtVDX8L-lguc7eiUIdoAERqI1ZK8GWAL-HgbC75cuMHFg/exec",
    DENWA: "https://script.google.com/macros/s/AKfycbyaiaR2hPXA8RN2E1_5GUYFNtzGnkUZC5Kq2xXt6Mw80QVRw0Wi7fBrM2k3MxyZhon4/exec"
};

const API = {
    // --- Internal Helpers ---
    async _get(url, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullUrl = query ? `${url}?${query}` : url;
        try {
            const res = await fetch(fullUrl);
            return await res.json();
        } catch (e) { console.error("GET Error:", e); throw e; }
    },

    async _post(url, payload, isFormData = false) {
        try {
            const options = { method: 'POST' };
            if (isFormData) {
                options.body = payload;
            } else {
                options.body = JSON.stringify(payload);
            }
            const res = await fetch(url, options);
            return await res.json();
        } catch (e) { console.error("POST Error:", e); throw e; }
    },

    // --- Notifications ---
    /**
     * Send email notifications via Google Apps Script.
     * Used for new orders (Matcha & Denwa) and other system alerts.
     * @param {string} action 
     * @param {object} data 
     * @param {string} [idToken] - Optional Firebase ID Token for admin authentication
     */
    async sendNotification(action, data, idToken = null) {
        const payload = { action, data };
        if (idToken) payload.idToken = idToken;
        return await this._post(ENDPOINTS.FIREBASE_HANDLER, payload);
    },

    // --- MATCHA Endpoints ---
    async fetchMatchaData() {
        return await this._get(ENDPOINTS.MATCHA);
    },

    // --- CORE Endpoints ---
    async fetchSystemData() {
        return await this._get(ENDPOINTS.CORE);
    },
    async queryOrder(params) {
        return await this._get(ENDPOINTS.CORE, { action: 'query', ...params });
    },
    async login(phone) {
        return await this._post(ENDPOINTS.CORE, { action: 'login', phone });
    },
    async checkout(orderData) {
        return await this._post(ENDPOINTS.CORE, { action: 'checkout', ...orderData });
    },
    async updateFastConfig(configData) {
        return await this._post(ENDPOINTS.CORE, { action: 'updateFastConfig', ...configData });
    },

    // --- DENWA Endpoints ---
    async fetchDenwaPlans() {
        return await this._get(ENDPOINTS.DENWA, { action: 'getPlans' });
    },
    async submitDenwaBooking(formData) {
        return await this._post(ENDPOINTS.DENWA, formData, true);
    },

    // --- CARD ORDER (Payment Links) ---
    /**
     * Generate payment form or URL for specialized card payment links.
     * @param {object} payload - Order data including link_id, amounts, and customer info.
     */
    async generateCardPayment(payload) {
        return await this._post(ENDPOINTS.FIREBASE_HANDLER, payload);
    },

    // 自帶測試資料處理
    initTestFill: function () {
        const params = new URLSearchParams(window.location.search);
        if (params.get('test_fill') !== '1') return;

        console.log('[TestFill] 偵測到測試參數，開始自動填入資料...');

        setTimeout(() => {
            const fieldMap = {
                // 姓名類
                'input-name': 't-測試姓名',
                'name': 't-測試姓名',
                'customerName': 't-測試姓名',

                // 電話類
                'input-phone': '0912345678',
                'phone': '0912345678',
                'tel': '0912345678',

                // Email
                'input-email': 'test@example.com',
                'email': 'test@example.com',

                // LINE
                'input-line': 't-line-id',
                'line': 't-line-id',
                'line_id': 't-line-id',

                // 備註 / 地址
                'input-note': 't-這是一則測試備註',
                'note': 't-這是一則測試備註',
                'comment': 't-這是一則測試備註',
                'address': 't-測試地址區街路123號',

                // 超商相關 (ID 可能因頁面而異)
                'store-id-7-11': '000711',
                'store-name-7-11': 't-測試門市(7-11)',
                'store-id-family': '000123',
                'store-name-family': 't-測試門市(全家)',
                'store_id': '000711',
                'store_name': 't-測試門市'
            };

            for (const [id, value] of Object.entries(fieldMap)) {
                const el = document.getElementById(id);
                if (el) {
                    el.value = value;
                    // 觸發 input 事件讓 Vue/React 或其它監聽器更新
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // 處理 diy.html 這種特殊的 checkbox/radio 或特定的物流選擇
            const logistics711 = document.querySelector('input[value*="7-11"]');
            if (logistics711) {
                logistics711.click();
            } else {
                const logisticsFM = document.querySelector('input[value*="全家"]');
                if (logisticsFM) logisticsFM.click();
            }

            console.log('[TestFill] 填入完成');
        }, 1000); // 延遲 1 秒確保頁面載入/Firebase 資料初始化完成
    }
};

// 頁面載入後自動偵測
window.addEventListener('DOMContentLoaded', () => {
    if (window.API && typeof window.API.initTestFill === 'function') {
        window.API.initTestFill();
    }
});

window.API = API;
