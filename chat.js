document.addEventListener('DOMContentLoaded', () => {
    // === 화면 전환 변수 ===
    const inputScreen = document.getElementById('input-screen');
    const resultScreen = document.getElementById('result-screen');
    const submitBtn = document.getElementById('submitBtn');
    const backBtn = document.getElementById('backBtn');

    // === 폼 컨트롤 변수 ===
    const genderToggles = document.querySelectorAll('.toggle-btn');
    const timeCheckbox = document.getElementById('unknownTime');
    const timeInput = document.getElementById('birthTime');
    const yajaCheckbox = document.getElementById('yajaTime');

    // === 결과 화면 렌더링 변수 ===
    const resName = document.getElementById('resName');
    const resDetails1 = document.getElementById('resDetails1');
    const userNameInput = document.getElementById('userName');
    const birthDateInput = document.getElementById('birthDate');
    const birthCityInput = document.getElementById('birthCity');
    const calTypeInput = document.getElementById('calendarType');

    // === 채팅 변수 ===
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('userInput');
    const sendChatBtn = document.getElementById('sendBtn');
    const BACKEND_URL = "http://127.0.0.1:5000/api/chat";

    // 1. 성별 토글 버튼 로직
    genderToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            genderToggles.forEach(b => {
                b.classList.remove('active');
                b.style.border = "none";
            });
            e.target.classList.add('active');
            e.target.style.border = "1px solid #333";
        });
    });

    // 2. 시간 모름 체크박스 로직
    timeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            timeInput.disabled = true;
            timeInput.value = "";
            timeInput.style.backgroundColor = "#eee";
            yajaCheckbox.checked = false;
            yajaCheckbox.disabled = true;
        } else {
            timeInput.disabled = false;
            timeInput.style.backgroundColor = "#fff";
            yajaCheckbox.disabled = false;
        }
    });

    // 3. 만세력 보러가기 (제출 로직)
    submitBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const date = birthDateInput.value;
        const time = timeInput.value;
        const city = birthCityInput.value.trim() || "대한민국";
        const isUnknownTime = timeCheckbox.checked;
        const gender = document.querySelector('.toggle-btn.active').innerText;
        const cal = calTypeInput.options[calTypeInput.selectedIndex].text;

        if (!name) return alert("이름을 입력해주세요.");
        if (!date) return alert("생년월일을 정확히 선택해주세요.");
        if (!isUnknownTime && !time) return alert("태어난 시간을 입력하거나 '시간 모름'을 체크해주세요.");

        // 파싱 및 결과 화면에 표출
        resName.innerText = name;
        const timeStr = isUnknownTime ? "시간모름" : time;
        resDetails1.innerText = `${cal} ${date.replace(/-/g, '/')} ${timeStr} ${gender} ${city}`;

        // 화면 전환 수행
        inputScreen.classList.remove('active');
        resultScreen.classList.add('active');
    });

    // 4. 뒤로 가기
    backBtn.addEventListener('click', () => {
        resultScreen.classList.remove('active');
        inputScreen.classList.add('active');
    });

    // 5. 프록시 백엔드(Gemini) 채팅 메시지 전송 로직
    function appendChatMessage(sender, text) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendChatMessage('user', text);
        chatInput.value = '';

        // 로딩 표출
        const loadId = 'load-' + Date.now();
        const loadDiv = document.createElement('div');
        loadDiv.id = loadId;
        loadDiv.classList.add('message', 'bot');
        loadDiv.innerHTML = '<div class="bubble">...</div>';
        chatBox.appendChild(loadDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();

            document.getElementById(loadId).remove();
            appendChatMessage('bot', data.reply);
        } catch (e) {
            document.getElementById(loadId).remove();
            appendChatMessage('bot', "서버 연결에 실패했습니다. 백엔드가 실행 중인지 확인하세요.");
        }
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
});
