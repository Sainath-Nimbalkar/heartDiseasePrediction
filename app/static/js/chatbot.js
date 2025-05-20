document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        msgDiv.classList.add('mb-2');
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        appendMessage("You", message);
        input.value = '';

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Network response was not ok");
            }

            const reply = data.reply || "Sorry, I couldn't find an answer.";
            appendMessage("Assistant", reply);
        } catch (error) {
            appendMessage("Assistant", `Error: ${error.message}`);
            console.error("Chat error:", error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
});