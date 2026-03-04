/**
 * KEICHA UI Dialog System (KUI)
 * A custom replacement for alert(), confirm(), and toast messages.
 */

const KUI = (() => {
    let activeDialog = null;

    const createOverlay = () => {
        const overlay = document.createElement('div');
        overlay.className = 'kui-overlay';
        document.body.appendChild(overlay);
        return overlay;
    };

    const alert = (message, title = '提醒') => {
        return new Promise((resolve) => {
            if (activeDialog) activeDialog.remove();

            const overlay = createOverlay();
            overlay.innerHTML = `
                <div class="kui-dialog">
                    <div class="kui-icon">
                        <span class="material-symbols-rounded">info</span>
                    </div>
                    <div class="kui-title">${title}</div>
                    <div class="kui-message">${message}</div>
                    <div class="kui-actions">
                        <button class="kui-btn kui-btn-primary">確定</button>
                    </div>
                </div>
            `;

            const btn = overlay.querySelector('.kui-btn-primary');
            btn.onclick = () => {
                overlay.remove();
                activeDialog = null;
                resolve();
            };

            activeDialog = overlay;
        });
    };

    const confirm = (message, title = '確認操作') => {
        return new Promise((resolve) => {
            if (activeDialog) activeDialog.remove();

            const overlay = createOverlay();
            overlay.innerHTML = `
                <div class="kui-dialog">
                    <div class="kui-icon">
                        <span class="material-symbols-rounded">help_outline</span>
                    </div>
                    <div class="kui-title">${title}</div>
                    <div class="kui-message">${message}</div>
                    <div class="kui-actions">
                        <button class="kui-btn kui-btn-secondary">取消</button>
                        <button class="kui-btn kui-btn-primary">確認</button>
                    </div>
                </div>
            `;

            const cancelBtn = overlay.querySelector('.kui-btn-secondary');
            const confirmBtn = overlay.querySelector('.kui-btn-primary');

            cancelBtn.onclick = () => {
                overlay.remove();
                activeDialog = null;
                resolve(false);
            };

            confirmBtn.onclick = () => {
                overlay.remove();
                activeDialog = null;
                resolve(true);
            };

            activeDialog = overlay;
        });
    };

    const toast = (message, duration = 3000) => {
        let container = document.querySelector('.kui-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'kui-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'kui-toast';
        toast.innerText = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -20px)';
            toast.style.transition = 'all 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Global listener for escape key to close dialog
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeDialog) {
            // By default, Escape acts as cancel/確定
            const btn = activeDialog.querySelector('.kui-btn-secondary') || activeDialog.querySelector('.kui-btn-primary');
            if (btn) btn.click();
        }
    });

    const prompt = (message, title = '輸入驗證', placeholder = '') => {
        return new Promise((resolve) => {
            if (activeDialog) activeDialog.remove();

            const overlay = createOverlay();
            overlay.innerHTML = `
                <div class="kui-dialog">
                    <div class="kui-icon">
                        <span class="material-symbols-rounded">lock_open</span>
                    </div>
                    <div class="kui-title">${title}</div>
                    <div class="kui-message">${message}</div>
                    <div class="kui-body" style="padding: 10px 20px;">
                        <input type="text" class="kui-input" placeholder="${placeholder}" 
                            style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; outline: none; border-color: #6ea44c;">
                    </div>
                    <div class="kui-actions">
                        <button class="kui-btn kui-btn-secondary">取消</button>
                        <button class="kui-btn kui-btn-primary">確認</button>
                    </div>
                </div>
            `;

            const input = overlay.querySelector('.kui-input');
            const cancelBtn = overlay.querySelector('.kui-btn-secondary');
            const confirmBtn = overlay.querySelector('.kui-btn-primary');

            setTimeout(() => input.focus(), 100);

            input.onkeydown = (e) => {
                if (e.key === 'Enter') confirmBtn.click();
            };

            cancelBtn.onclick = () => {
                overlay.remove();
                activeDialog = null;
                resolve(null);
            };

            confirmBtn.onclick = () => {
                const val = input.value;
                overlay.remove();
                activeDialog = null;
                resolve(val);
            };

            activeDialog = overlay;
        });
    };

    const validate = (el, message = "請填寫此欄位") => {
        // 先清除現有的
        const existing = document.querySelector('.kui-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'kui-tooltip';
        tooltip.innerHTML = `
            <div class="kui-tooltip-icon">!</div>
            <div>${message}</div>
        `;
        document.body.appendChild(tooltip);

        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // 計算位置 (靠左對齊輸入框上方)
        tooltip.style.left = `${rect.left + scrollX}px`;
        tooltip.style.top = `${rect.top + scrollY - tooltip.offsetHeight - 10}px`;

        // 偵測輸入即清除
        el.addEventListener('input', () => tooltip.remove(), { once: true });

        // 5秒後自動消失
        setTimeout(() => { if (tooltip.parentNode) tooltip.remove(); }, 5000);

        // 點擊頁面其他地方清除
        const closeTooltip = (e) => {
            if (!el.contains(e.target)) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        };
        setTimeout(() => document.addEventListener('click', closeTooltip), 10);
    };

    const initSelect = (selectEl) => {
        if (!selectEl || selectEl.getAttribute('data-kui-init')) return;
        selectEl.setAttribute('data-kui-init', 'true');

        // 建立容器
        const container = document.createElement('div');
        container.className = 'kui-select-container';
        selectEl.parentNode.insertBefore(container, selectEl);
        container.appendChild(selectEl);
        selectEl.classList.add('kui-select-native');

        // 建立顯示區域
        const display = document.createElement('div');
        display.className = 'kui-select-display';
        display.innerText = selectEl.options[selectEl.selectedIndex]?.text || "請選擇";
        container.appendChild(display);

        // 建立選單
        const menu = document.createElement('div');
        menu.className = 'kui-select-menu';
        container.appendChild(menu);

        const renderOptions = () => {
            menu.innerHTML = '';
            Array.from(selectEl.options).forEach((opt, idx) => {
                const item = document.createElement('div');
                item.className = 'kui-select-option';
                if (idx === selectEl.selectedIndex) item.classList.add('selected');
                item.innerText = opt.text;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectEl.selectedIndex = idx;
                    selectEl.dispatchEvent(new Event('change'));
                    display.innerText = opt.text;
                    container.classList.remove('open');
                    renderOptions(); // 更新選中狀態樣式
                };
                menu.appendChild(item);
            });
        };

        display.onclick = (e) => {
            e.stopPropagation();
            // 先關閉其他所有選單
            document.querySelectorAll('.kui-select-container.open').forEach(el => {
                if (el !== container) el.classList.remove('open');
            });
            container.classList.toggle('open');
            if (container.classList.contains('open')) renderOptions();
        };

        // 監聽原生 select 的外部變化
        selectEl.addEventListener('change', () => {
            display.innerText = selectEl.options[selectEl.selectedIndex]?.text || "請選擇";
        });

        // 點擊外部關閉
        document.addEventListener('click', () => {
            container.classList.remove('open');
        });
    };

    const initAllSelects = (parent = document) => {
        parent.querySelectorAll('select.form-input, select.admin-select').forEach(initSelect);
    };

    return { alert, confirm, prompt, toast, validate, initSelect, initAllSelects };
})();

// Re-expose to global window
window.KUI = KUI;
