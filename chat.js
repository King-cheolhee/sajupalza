document.addEventListener('DOMContentLoaded', () => {
    // === 화면 컨트롤 변수 ===
    const inputScreen = document.getElementById('input-screen');
    const resultScreen = document.getElementById('result-screen');
    const submitBtn = document.getElementById('submitBtn');

    // 네비게이션
    const backBtn = document.getElementById('backBtn');
    const mainBackBtn = document.getElementById('mainBackBtn');

    // 모달 관련
    const btn12Ganji = document.getElementById('btn12Ganji');
    const modal12Ganji = document.getElementById('modal-12ganji');

    const btnYaja = document.getElementById('btnYaja');
    const modalYaja = document.getElementById('modal-yaja');
    const closeBtns = document.querySelectorAll('.modal-close-btn');

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
    const calTypeInput = document.getElementById('calendarType');

    // === 챗봇 변수 ===
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('userInput');
    const sendChatBtn = document.getElementById('sendBtn');
    const BACKEND_URL = "http://127.0.0.1:5000/api/chat";

    // 1. 모달 팝업 컨트롤 (돋보기 기능)
    btn12Ganji.addEventListener('click', () => modal12Ganji.classList.add('active'));
    btnYaja.addEventListener('click', () => modalYaja.classList.add('active'));

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('active');
        });
    });

    // 2. 성별 토글 로직
    genderToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            genderToggles.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 3. 시간 모름 체크박스 로직 (입력 자연스럽게 통제)
    timeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            timeInput.disabled = true;
            timeInput.value = "";
            timeInput.style.color = "#aaa";
            yajaCheckbox.checked = false;
            yajaCheckbox.disabled = true;
        } else {
            timeInput.disabled = false;
            timeInput.style.color = "#1e293b";
            yajaCheckbox.disabled = false;
        }
    });

    // 4. 메인 화면 뒤로가기 클릭 시 이전 페이지나 닫기를 위한 기본 작동(여기선 alert)
    mainBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            alert("첫 화면입니다.");
        }
    });

    // 5. 만세력 보러가기 (제출)
    submitBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const date = birthDateInput.value;
        const time = timeInput.value;
        const isUnknownTime = timeCheckbox.checked;
        const gender = document.querySelector('.toggle-btn.active').innerText;
        const cal = calTypeInput.options[calTypeInput.selectedIndex].text;

        if (!name) return alert("이름을 입력해주세요.");
        if (!date) return alert("생년월일을 정확히 선택해주세요.");
        if (!isUnknownTime && !time) return alert("태어난 시간을 입력하거나 '시간 모름'을 체크해주세요.");

        // 파싱 및 결과 화면 갱신 (도시 삭제됨)
        resName.innerText = name;
        const timeStr = isUnknownTime ? "시간 모름" : time;
        resDetails1.innerText = `${cal} ${date.replace(/-/g, '/')} ${timeStr} ${gender}`;

        // 화면 전환 수행
        inputScreen.classList.remove('active');
        resultScreen.classList.add('active');
    });

    // 6. 결과 화면에서 뒤로 가기
    backBtn.addEventListener('click', () => {
        resultScreen.classList.remove('active');
        inputScreen.classList.add('active');
    });

    // 7. 챗봇 API 연동 로직
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
            appendChatMessage('bot', "도사님과 연결이 원활하지 않습니다. (Gemini API 서버 오류)");
        }
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
});
