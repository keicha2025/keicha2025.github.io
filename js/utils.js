/**
 * js/utils.js
 * 項目通用的工具函式庫。
 */

const Utils = {
    // --- 格式化 (Formatters) ---

    /**
     * 格式化日期 (YYYY/MM/DD HH:mm)
     */
    formatDate(timestamp) {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(/-/g, '/');
    },

    /**
     * 格式化金額
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            maximumFractionDigits: 0
        }).format(amount);
    },

    // --- 介面控制 (UI Helpers) ---

    showLoading() {
        const gl = document.getElementById('globalLoading');
        if (gl) gl.style.display = 'flex';
    },

    hideLoading() {
        const gl = document.getElementById('globalLoading');
        if (gl) gl.style.display = 'none';
    },

    toggleOverlay(show) {
        const overlay = document.querySelector('.overlay');
        if (overlay) {
            if (show) overlay.classList.add('open');
            else overlay.classList.remove('open');
        }
    },

    // --- 資料驗證 (Validation) ---

    isValidPhone(phone) {
        return /^09\d{8}$/.test(phone);
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // --- 本地存儲 ---
    storage: {
        set(key, value) {
            localStorage.setItem(`keicha_${key}`, JSON.stringify(value));
        },
        get(key) {
            const val = localStorage.getItem(`keicha_${key}`);
            try {
                return val ? JSON.parse(val) : null;
            } catch (e) { return null; }
        },
        remove(key) {
            localStorage.removeItem(`keicha_${key}`);
        }
    }
};

window.Utils = Utils;
