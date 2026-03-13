const username = prompt('¿Cuál es tu nombre?') || 'Anónimo';

const charCount = document.getElementById('char-count');
const textarea = document.getElementById('message');

textarea.addEventListener('input', () => {
    const remaining = 140 - textarea.value.length;
    charCount.textContent = remaining;
    charCount.classList.toggle('warn', remaining <= 20);
});

const IMAGE_RE = /^https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
const URL_RE = /https?:\/\/[^\s]+/;

const isImageUrl = (text) => IMAGE_RE.test(text.trim());
const extractUrl = (text) => {
    const match = text.match(URL_RE);
    return match ? match[0] : null;
};

const previewCache = {};

const fetchPreview = async (url) => {
    if (previewCache[url] !== undefined) return previewCache[url];
    previewCache[url] = null;
    try {
        const res = await fetch('/api/preview?url=' + encodeURIComponent(url));
        const data = await res.json();
        previewCache[url] = data;
        return data;
    } catch {
        return null;
    }
};

const renderLinkPreview = (data, url) => {
    const card = document.createElement('a');
    card.href = url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'link-preview';

    if (data.image) {
        const img = document.createElement('img');
        img.src = data.image;
        img.alt = '';
        card.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'link-preview-info';

    const domain = document.createElement('span');
    domain.className = 'link-preview-domain';
    try { domain.textContent = new URL(url).hostname; } catch { domain.textContent = url; }

    const title = document.createElement('strong');
    title.className = 'link-preview-title';
    title.textContent = data.title || url;

    info.appendChild(domain);
    info.appendChild(title);

    if (data.description) {
        const desc = document.createElement('p');
        desc.className = 'link-preview-desc';
        desc.textContent = data.description;
        info.appendChild(desc);
    }

    card.appendChild(info);
    return card;
};

const renderMessage = (message, onPreviewLoaded) => {
    const li = document.createElement('li');
    const isMine = message.user === username;
    li.className = isMine ? 'mine' : 'theirs';

    const name = document.createElement('span');
    name.className = 'msg-name';
    name.textContent = message.user;
    li.appendChild(name);

    if (isImageUrl(message.text)) {
        const preview = document.createElement('div');
        preview.className = 'img-preview';
        const img = document.createElement('img');
        img.src = message.text;
        img.alt = 'imagen';
        preview.appendChild(img);
        li.appendChild(preview);
        return li;
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = message.text;
    li.appendChild(bubble);

    const url = extractUrl(message.text);
    if (url && !isImageUrl(url)) {
        fetchPreview(url).then((data) => {
            if (data && (data.title || data.image)) {
                li.appendChild(renderLinkPreview(data, url));
                if (onPreviewLoaded) onPreviewLoaded();
            }
        });
    }

    return li;
};

let lastMessageCount = 0;

const getMessages = async () => {
    const response = await fetch('/api/messages');
    const messages = await response.json();

    if (messages.length === lastMessageCount) return;

    const ul = document.getElementById('messages');
    const wasAtBottom = ul.scrollHeight - ul.scrollTop <= ul.clientHeight + 40;

    ul.innerHTML = '';
    for (const message of messages) {
        if (!message.text || !message.text.trim()) continue;
        ul.appendChild(renderMessage(message, () => {
            if (wasAtBottom) ul.scrollTop = ul.scrollHeight;
        }));
    }

    lastMessageCount = messages.length;
    if (wasAtBottom) ul.scrollTop = ul.scrollHeight;
};

const postMessage = async (message) => {
    await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message)
    });
    getMessages();
};

const sendMessage = () => {
    const text = textarea.value.trim();
    if (!text) return;
    postMessage({ user: username, text });
    textarea.value = '';
    charCount.textContent = '140';
    charCount.classList.remove('warn');
};

document.getElementById('send').addEventListener('click', sendMessage);

textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

getMessages();
setInterval(getMessages, 1000);