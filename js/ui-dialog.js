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

    return { alert, confirm, toast };
})();

// Re-expose to global window
window.KUI = KUI;
