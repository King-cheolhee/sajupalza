document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // 파이썬 백엔드 API 주소
    const BACKEND_URL = "http://127.0.0.1:5000/api/chat"; 
    
    let isWaitingForInfo = true;

    function appendMessage(sender, content, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        if (isHtml) {
            msgDiv.innerHTML = content;
        } else {
            msgDiv.innerHTML = `<div class="bubble">${content.replace(/\n/g, '<br>')}</div>`;
        }
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // 신뢰감을 더해줄 만세력 명식 시각화
    function showManseoryok() {
        const template = document.getElementById('manseoryokTemplate');
        if (!template) return;
        const clone = template.content.cloneNode(true);
        
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot');
        msgDiv.appendChild(clone);
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        userInput.value = '';

        // 정보 입력 감지 및 만세력 표출
        let justShowedSaju = false;
        if(isWaitingForInfo && (text.includes('년') || /\d/.test(text))) {
            isWaitingForInfo = false;
            justShowedSaju = true;
            appendMessage('bot', `<div class="bubble">입력해주신 정보를 바탕으로 아래와 같이 사주 명식(만세력)을 뽑아보았습니다. 잠시만 결과를 분석할게요... 🔮</div>`, true);
            setTimeout(() => { showManseoryok(); }, 600);
        }

        const loadingId = "load-" + Date.now();
        setTimeout(() => {
            if(!document.getElementById(loadingId)) {
                const loadingDiv = document.createElement('div');
                loadingDiv.classList.add('message', 'bot');
                loadingDiv.id = loadingId;
                loadingDiv.innerHTML = `<div class="bubble">...</div>`;
                chatBox.appendChild(loadingDiv);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, justShowedSaju ? 1500 : 500); // 만세력이 뜨면 로딩 표시 지연

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            
            setTimeout(() => {
                const loader = document.getElementById(loadingId);
                if(loader) loader.remove();
                
                appendMessage('bot', data.reply);
            }, justShowedSaju ? 2500 : 300); 
            
        } catch (error) {
            const loader = document.getElementById(loadingId);
            if(loader) loader.remove();
            appendMessage('bot', "앗, 도사님과의 통신이 불안정합니다. 백엔드 서버가 켜져있는지 확인해주세요.");
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
