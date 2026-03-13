const username = prompt('¿Cuál es tu nombre?') || 'Anónimo';

const getMessages = async () => {
    const response = await fetch('/api/messages');
    const messages = await response.json();
    
    const ul = document.getElementById('messages');
    ul.innerHTML = '';

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const li = document.createElement('li');
        li.innerHTML = `<strong>${message.user}</strong>: ${message.text}`;
        ul.appendChild(li);
    }

    // Auto-scroll al último mensaje
    ul.scrollTop = ul.scrollHeight;
}

const postMessage = async (message) => {
    await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message)
    });
    getMessages();
}

getMessages();

setInterval(() => {
    getMessages();
}, 1000);

document.getElementById('send').addEventListener('click', () => {
    const textarea = document.getElementById('message');
    const text = textarea.value.trim();
    if (!text) return;
    postMessage({
        user: username,
        text: text
    });
    textarea.value = '';
});

// Enviar con Enter (Shift+Enter para salto de línea)
document.getElementById('message').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send').click();
    }
});