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
    }
};

window.API = API;
