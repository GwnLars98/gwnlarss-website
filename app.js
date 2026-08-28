const POLL_MS = 20_000;
const CONTENT_POLL_MS = 60_000;

const els = {
    navDot: document.getElementById('nav-dot'),
    badge: document.getElementById('live-badge'),
    badgeText: document.getElementById('live-badge-text'),
    streamTitle: document.getElementById('stream-title'),
    watchBtn: document.getElementById('watch-btn'),
    embedContainer: document.getElementById('twitch-embed'),
    liveTag: document.getElementById('preview-live-tag'),
    avatar: document.getElementById('avatar'),
    avatarPlaceholder: document.getElementById('avatar-placeholder'),
    previewName: document.getElementById('preview-name'),
    previewSub: document.getElementById('preview-sub'),
};

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function mountTwitchEmbed(login) {
    if (els.embedContainer.dataset.mounted === login) return;
    els.embedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.twitch.tv/?channel=${encodeURIComponent(login)}&parent=${encodeURIComponent(location.hostname)}&muted=true`;
    iframe.allowFullscreen = true;
    iframe.title = `${login} live op Twitch`;
    els.embedContainer.appendChild(iframe);
    els.embedContainer.dataset.mounted = login;
}

function render(data) {
    if (!data.geconfigureerd) {
        els.badgeText.textContent = 'Live-status niet beschikbaar';
        return;
    }

    els.previewName.textContent = data.displayName || 'GwnLarss';
    document.querySelectorAll('a[href^="https://twitch.tv/"]').forEach(a => {
        a.href = `https://twitch.tv/${data.twitchLogin}`;
    });
    mountTwitchEmbed(data.twitchLogin);

    if (data.profileImageUrl) {
        els.avatar.src = data.profileImageUrl;
        els.avatar.hidden = false;
        els.avatarPlaceholder.hidden = true;
    }

    if (data.live) {
        els.navDot.classList.add('dot--live');
        els.badge.classList.add('badge--live');
        els.badgeText.textContent = '🔴 Live nu';
        els.watchBtn.textContent = 'Kijk nu op Twitch';
        els.watchBtn.classList.add('is-live');
        els.streamTitle.textContent = data.game
            ? `"${data.title}" · ${data.game}${data.viewers != null ? ` · ${data.viewers} kijkers` : ''}`
            : data.title || '';
        els.liveTag.hidden = false;
        els.previewSub.textContent = 'is live';
    } else {
        els.navDot.classList.remove('dot--live');
        els.badge.classList.remove('badge--live');
        els.badgeText.textContent = '⚫ Momenteel offline';
        els.watchBtn.textContent = 'Volg op Twitch';
        els.watchBtn.classList.remove('is-live');
        els.streamTitle.textContent = '';
        els.liveTag.hidden = true;
        els.previewSub.textContent = 'op Twitch';
    }
}

async function checkLive() {
    try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        render(await res.json());
    } catch {
        els.badgeText.textContent = 'Live-status kon niet geladen worden';
    }
}

function renderPostCard(container, data, emptyText) {
    if (!data) {
        container.innerHTML = `<p class="post-card__empty">${escapeHtml(emptyText)}</p>`;
        return;
    }
    container.innerHTML = `
        <p class="post-card__title">${escapeHtml(data.titel)}</p>
        <p class="post-card__body">${escapeHtml(data.beschrijving)}</p>
        ${data.afbeelding ? `<img src="${escapeHtml(data.afbeelding)}" alt="">` : ''}
        <p class="post-card__meta">Geplaatst door ${escapeHtml(data.auteur)} · ${new Date(data.tijdstip).toLocaleString('nl-NL')}</p>
    `;
}

async function checkContent() {
    try {
        const res = await fetch('/api/content', { cache: 'no-store' });
        const data = await res.json();
        renderPostCard(document.getElementById('schema-card'), data.schema, 'Nog geen schema geplaatst, check het schema-kanaal op Discord.');
        renderPostCard(document.getElementById('updates-card'), data.update, 'Nog geen berennieuws, check het updates-kanaal op Discord.');
    } catch { /* laat de bestaande inhoud gewoon staan */ }
}

checkLive();
setInterval(checkLive, POLL_MS);
checkContent();
setInterval(checkContent, CONTENT_POLL_MS);

document.getElementById('footer-year').textContent = new Date().getFullYear();
