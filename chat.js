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
    const ampmSelect = document.getElementById('ampmType');

    // 자동 하이픈 변수
    const birthDateInput = document.getElementById('birthDate');

    // === 결과 화면 렌더링 변수 ===
    const resName = document.getElementById('resName');
    const resDetails1 = document.getElementById('resDetails1');
    const userNameInput = document.getElementById('userName');
    const calTypeInput = document.getElementById('calendarType');

    // === 챗봇 변수 ===
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('userInput');
    const sendChatBtn = document.getElementById('sendBtn');
    const BACKEND_URL = "http://127.0.0.1:5000/api/chat";

    // 1. 모달 팝업 컨트롤
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

    // 3. 편리한 자동 하이픈 폼 (날짜 : YYYY-MM-DD)
    birthDateInput.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, ''); // 숫자 외 모두 제거
        if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
        if (val.length > 7) val = val.slice(0, 7) + '-' + val.slice(7);
        this.value = val.slice(0, 10);
    });

    // 4. 편리한 자동 하이픈 시간 (시간 : HH:MM)
    timeInput.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, ''); // 숫자 외 모두 제거
        if (val.length > 2) val = val.slice(0, 2) + ':' + val.slice(2);
        this.value = val.slice(0, 5);
    });

    // 5. 시간 모름 체크박스 로직
    timeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            timeInput.disabled = true;
            ampmSelect.disabled = true;
            timeInput.value = "";
            timeInput.style.color = "#7e756d"; // disable 느낌
            ampmSelect.style.color = "#7e756d";
            yajaCheckbox.checked = false;
            yajaCheckbox.disabled = true;
        } else {
            timeInput.disabled = false;
            ampmSelect.disabled = false;
            timeInput.style.color = "#e6dfd3";
            ampmSelect.style.color = "#e6dfd3";
            yajaCheckbox.disabled = false;
        }
    });

    // 6. 메인 화면 뒤로가기 클릭
    mainBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            alert("첫 화면입니다.");
        }
    });

    // 7. 만세력 보러가기 (제출)
    submitBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const date = birthDateInput.value;
        const time = timeInput.value;
        const isUnknownTime = timeCheckbox.checked;
        const gender = document.querySelector('.toggle-btn.active').innerText.split(' ')[0]; // 여성, 남성만 추출
        const cal = calTypeInput.options[calTypeInput.selectedIndex].innerText.split(' ')[0]; // 양력, 음력 추출
        const ampm = ampmSelect.options[ampmSelect.selectedIndex].innerText;

        if (!name) return alert("성함을 빈칸 없이 남겨주십시오.");
        if (date.length !== 10) return alert("생년월일을 8자리 숫자(예: 19900101)로 끝까지 입력해주십시오.");
        if (!isUnknownTime && time.length !== 5) return alert("태어난 시간을 4자리 숫자(예: 0930)로 입력하거나 '시간 모름'을 확인해주십시오.");

        // 파싱 및 결과 화면 갱신
        resName.innerText = name;
        const timeStr = isUnknownTime ? "시간 모름" : `${ampm} ${time}`;
        resDetails1.innerText = `${cal} ${date.replace(/-/g, '/')} ${timeStr} ${gender}`;

        // 화면 전환 
        inputScreen.classList.remove('active');
        resultScreen.classList.add('active');
    });

    // 8. 결과 화면에서 뒤로 가기
    backBtn.addEventListener('click', () => {
        resultScreen.classList.remove('active');
        inputScreen.classList.add('active');
    });

    // 9. 명리 도사님 대화 API 연동 
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
            appendChatMessage('bot', "하늘의 기운(서버)과 닿지 않고 있습니다. 잠시 후 다시 시도해주시지요.");
        }
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
});
