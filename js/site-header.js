const menus = document.querySelectorAll('.site-menu');

document.addEventListener('click', ({ target }) => {
    for (const menu of menus) {
        if (menu.open && (!menu.contains(target) || target.closest('a'))) menu.open = false;
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;

    for (const menu of menus) {
        if (!menu.open || !menu.getClientRects().length) continue;
        if (menu.contains(document.activeElement)) menu.querySelector('summary').focus();
        menu.open = false;
    }
});

if (navigator.share) {
    const shareData = {
        title: document.querySelector('meta[property="og:title"]').content,
        text: document.querySelector('meta[property="og:description"]').content,
        url: document.querySelector('meta[property="og:url"]').content
    };

    for (const button of document.querySelectorAll('[data-site-share]')) {
        button.hidden = false;
        button.addEventListener('click', async () => {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== 'AbortError') console.error('分享失敗', error);
            }
        });
    }
}
