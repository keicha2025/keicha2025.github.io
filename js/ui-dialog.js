/**
 * KEICHA UI Dialog System (KUI)
 * A custom replacement for alert(), confirm(), and toast messages.
 */

const KUI = (() => {
    let activeDialog = null;

    const showDialog = (kind, message, title, placeholder) => {
        activeDialog?.close();
        const dialog = document.createElement('dialog');
        dialog.className = 'kui-dialog';
        dialog.setAttribute('aria-labelledby', 'kui-title');
        dialog.setAttribute('aria-describedby', 'kui-message');

        const isAlert = kind === 'alert';
        const isPrompt = kind === 'prompt';
        const icon = { alert: 'info', confirm: 'help_outline', prompt: 'lock_open' }[kind];
        dialog.innerHTML = `
            <span class="kui-icon material-symbols-rounded" aria-hidden="true">${icon}</span>
            <h2 class="kui-title" id="kui-title"></h2>
            <p class="kui-message" id="kui-message"></p>
            <form method="dialog">
                ${isPrompt ? '<input type="text" class="kui-input" aria-label="驗證文字" autofocus>' : ''}
                <div class="kui-actions">
                    ${isAlert ? '' : `<button type="button" class="kui-btn kui-btn-secondary" ${isPrompt ? '' : 'autofocus'}>取消</button>`}
                    <button type="submit" class="kui-btn kui-btn-primary" value="confirm" ${isAlert ? 'autofocus' : ''}>${isAlert ? '確定' : '確認'}</button>
                </div>
            </form>
        `;
        dialog.querySelector('.kui-title').textContent = title;
        dialog.querySelector('.kui-message').textContent = message;
        const input = dialog.querySelector('input');
        if (input) input.placeholder = placeholder;
        dialog.querySelector('.kui-btn-secondary')?.addEventListener('click', () => dialog.close());

        return new Promise((resolve) => {
            dialog.addEventListener('close', () => {
                const accepted = dialog.returnValue === 'confirm';
                if (activeDialog === dialog) activeDialog = null;
                dialog.remove();
                if (isAlert) resolve();
                else if (isPrompt) resolve(accepted ? input.value : null);
                else resolve(accepted);
            }, { once: true });

            if (activeDialog) activeDialog.remove();
            activeDialog = dialog;
            document.body.append(dialog);
            dialog.showModal();
        });
    };

    const alert = (message, title = '提醒') => showDialog('alert', message, title);
    const confirm = (message, title = '確認操作') => showDialog('confirm', message, title);
    const prompt = (message, title = '輸入驗證', placeholder = '') => showDialog('prompt', message, title, placeholder);

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

    const copyText = (text, successMsg = '已複製到剪貼簿') => {
        if (!navigator.clipboard) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                toast(successMsg);
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            toast(successMsg);
        }).catch(err => {
            console.error('Clipboard copy failed', err);
        });
    };

    return { alert, confirm, prompt, toast, validate, copyText };
})();

// Re-expose to global window
window.KUI = KUI;
