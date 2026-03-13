const username = prompt('¿Cuál es tu nombre?') || 'Anónimo';

const charCount = document.getElementById('char-count');
const textarea = document.getElementById('message');

textarea.addEventListener('input', () => {
    const remaining = 140 - textarea.value.length;
    charCount.textContent = remaining;
    charCount.classList.toggle('warn', remaining <= 20);
});

const isImageUrl = (text) => {
    return /^https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text.trim());
};

const renderMessage = (message) => {
    const li = document.createElement('li');
    const isMine = message.user === username;
    li.className = isMine ? 'mine' : 'theirs';

    const name = document.createElement('span');
    name.className = 'msg-name';
    name.textContent = message.user;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = message.text;

    li.appendChild(name);
    li.appendChild(bubble);

    if (isImageUrl(message.text)) {
        bubble.textContent = '';
        const preview = document.createElement('div');
        preview.className = 'img-preview';
        const img = document.createElement('img');
        img.src = message.text;
        img.alt = 'imagen';
        preview.appendChild(img);
        li.appendChild(preview);
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
        ul.appendChild(renderMessage(message));
    }

    lastMessageCount = messages.length;

    if (wasAtBottom) {
        ul.scrollTop = ul.scrollHeight;
    }
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