document.addEventListener('DOMContentLoaded', () => {
    // === 화면 컨트롤 변수 ===
    const inputScreen = document.getElementById('input-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const resultScreen = document.getElementById('result-screen');
    const submitBtn = document.getElementById('submitBtn');

    // 네비게이션
    const backBtn = document.getElementById('backBtn');

    // 모달 관련
    const btn12Ganji = document.getElementById('btn12Ganji');
    const modal12Ganji = document.getElementById('modal-12ganji');

    const btnYaja = document.getElementById('btnYaja');
    const modalYaja = document.getElementById('modal-yaja');
    const closeBtns = document.querySelectorAll('.modal-close');

    // === 폼 변수 ===
    let isResultGenerated = false; // 사주 계산이 한 번이라도 되었는지 상태 보존

    const genderToggles = document.querySelectorAll('.toggle-btn');
    const timeCheckbox = document.getElementById('unknownTime');
    const timeInput = document.getElementById('birthTime');
    const yajaCheckbox = document.getElementById('yajaTime');
    const ampmSelect = document.getElementById('ampmType');

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
    const BACKEND_URL = "http://127.0.0.1:5000/api/chat/stream";

    // === 세션 및 사주 정보 관리 ===
    let sessionId = 'session-' + Date.now();
    let sajuInfo = null;       // 사주 정보 저장
    let isFirstMessage = true; // 첫 메시지 여부 (사주 정보 전달용)
    let cachedFirstResponse = null;  // 첫 응답 캐시 (유명인 일관성 보장)
    let cachedSajuKey = null;        // 캐시 키 (사주 정보 해시)

    // 1. 모달 팝업
    btn12Ganji.addEventListener('click', () => modal12Ganji.classList.add('active'));
    btnYaja.addEventListener('click', () => modalYaja.classList.add('active'));

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('active');
        });
    });

    // 2. 성별 토글
    genderToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            genderToggles.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 3. 자동 하이픈 (YYYY-MM-DD)
    birthDateInput.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
        if (val.length > 7) val = val.slice(0, 7) + '-' + val.slice(7);
        this.value = val.slice(0, 10);
    });

    // 4. 자동 하이픈 (HH:MM)
    timeInput.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2) + ':' + val.slice(2);
        this.value = val.slice(0, 5);
    });

    // 5. 시간 모름
    timeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            timeInput.disabled = true;
            ampmSelect.disabled = true;
            timeInput.value = "";
            timeInput.style.color = "#4a5568";
            ampmSelect.style.color = "#4a5568";
            yajaCheckbox.checked = false;
            yajaCheckbox.disabled = true;
        } else {
            timeInput.disabled = false;
            ampmSelect.disabled = false;
            timeInput.style.color = "var(--text-sub)";
            ampmSelect.style.color = "var(--text-sub)";
            yajaCheckbox.disabled = false;
        }
    });


    // 6. 만세력 보러가기 (제출) -> 로딩 2~3초 -> 결과화면
    submitBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const date = birthDateInput.value;
        const time = timeInput.value;
        const isUnknownTime = timeCheckbox.checked;
        const gender = document.querySelector('.toggle-btn.active').innerText.split(' ')[0];
        const cal = calTypeInput.options[calTypeInput.selectedIndex].innerText.split(' ')[0];
        const ampm = ampmSelect.options[ampmSelect.selectedIndex].innerText;

        if (!name) return alert("성함을 빈칸 없이 남겨주십시오.");
        if (date.length !== 10) return alert("생년월일을 8자리 숫자(예: 19900101)로 끝까지 입력해주십시오.");
        if (!isUnknownTime && time.length !== 5) return alert("태어난 시간을 4자리 숫자로 입력하거나 '시간 모름'을 체크해주십시오.");

        // 데이터 파싱 및 삽입
        resName.innerText = name;
        const timeStr = isUnknownTime ? "시간 모름" : `${ampm} ${time}`;
        resDetails1.innerText = `${cal} ${date.replace(/-/g, '/')} ${timeStr} ${gender}`;

        // 사주 정보 저장 (AI 상담에 전달용)
        sajuInfo = {
            name: name,
            gender: gender,
            birthDate: date,
            birthTime: timeStr,
            calendar: cal
        };
        isFirstMessage = true;
        sessionId = 'session-' + Date.now(); // 새 상담 시 세션 초기화

        // 만세력 계산 (양력 기준)
        const [bYear, bMonth, bDay] = date.split('-').map(Number);
        let bHour = null, bMinute = 0;
        if (!isUnknownTime && time.length === 5) {
            const [h, m] = time.split(':').map(Number);
            // 오전/오후 → 24시간 변환
            if (ampm === '오후' && h < 12) bHour = h + 12;
            else if (ampm === '오전' && h === 12) bHour = 0;
            else bHour = h;
            bMinute = m;
        }

        // 화면 전환 로직 (입력 -> 로딩 -> 대기 -> 결과)
        inputScreen.classList.remove('active');
        loadingScreen.classList.add('active');

        setTimeout(() => {
            loadingScreen.classList.remove('active');
            resultScreen.classList.add('active');

            // 만세력을 chatBox 내부 첫 요소로 삽입 (스크롤과 함께 이동)
            if (typeof SajuCalc !== 'undefined') {
                const sajuResult = SajuCalc.calculate(bYear, bMonth, bDay, bHour, bMinute);
                const chartDiv = document.createElement('div');
                chartDiv.classList.add('message', 'saju-chart-msg');
                chartDiv.innerHTML = SajuCalc.renderHTML(sajuResult);
                chatBox.appendChild(chartDiv);

                // 만세력 결과를 sajuInfo에 포함 (Gemini에게 정확한 사주 데이터 전달)
                sajuInfo.sajuWonGuk = {
                    yearPillar: sajuResult.year.hanjaText + '(' + sajuResult.year.text + ')',
                    monthPillar: sajuResult.month.hanjaText + '(' + sajuResult.month.text + ')',
                    dayPillar: sajuResult.day.hanjaText + '(' + sajuResult.day.text + ')',
                    hourPillar: sajuResult.hour ? sajuResult.hour.hanjaText + '(' + sajuResult.hour.text + ')' : '시간 모름',
                    ilgan: sajuResult.ilgan + '(' + sajuResult.ilganHanja + ')',
                    tti: sajuResult.tti,
                    yearSipsin: sajuResult.yearSipsin,
                    monthSipsin: sajuResult.monthSipsin,
                    hourSipsin: sajuResult.hourSipsin || '모름'
                };
            }

            // 상태 보존 활성화
            isResultGenerated = true;

            // 자동으로 AI에게 첫 인사 전송 (사주 정보 포함)
            autoSendFirstMessage();
        }, 2200); // 2.2초 대기
    });

    // 7. 결과 화면에서 뒤로 가기
    backBtn.addEventListener('click', () => {
        resultScreen.classList.remove('active');
        inputScreen.classList.add('active');
        // 채팅 내역 초기화 (다시 입력 시 중복 방지)
        chatBox.innerHTML = '';
        isFirstMessage = true;
        isResultGenerated = false;
    });


    // 9. API 연동 부분
    function appendChatMessage(sender, text) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // 결과 화면 진입 시 자동으로 사주 분석 요청 (사용자 메시지 없이 AI가 바로 분석 시작)
    async function autoSendFirstMessage() {
        // 동일 사주 정보면 캐시된 응답 재사용 (유명인 일관성 보장)
        const currentSajuKey = JSON.stringify(sajuInfo);
        if (cachedFirstResponse && cachedSajuKey === currentSajuKey) {
            const botDiv = document.createElement('div');
            botDiv.classList.add('message', 'bot');
            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            bubble.innerHTML = cachedFirstResponse.replace(/\n/g, '<br>');
            botDiv.appendChild(bubble);
            chatBox.appendChild(botDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            isFirstMessage = false;
            return;
        }

        const firstMessage = "이 사람의 사주를 분석하고, 첫 응답 형식에 따라 유명인 소개, 사주 특성, 총운 한줄, 질문 카테고리를 안내해 주세요.";

        // 빈 말풍선 생성 (스트리밍으로 채워질 예정)
        const botDiv = document.createElement('div');
        botDiv.classList.add('message', 'bot');
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = '...';
        botDiv.appendChild(bubble);
        chatBox.appendChild(botDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: firstMessage,
                    sessionId: sessionId,
                    sajuInfo: sajuInfo,
                    language: currentLang || 'ko'
                })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            bubble.innerHTML = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const text = line.slice(6);
                        if (text === '[DONE]') continue;
                        fullText += text;
                        bubble.innerHTML = fullText.replace(/\n/g, '<br>');
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                }
            }
            isFirstMessage = false;
            // 첫 응답 캐싱 (다시 입력하기 시 동일 응답 보장)
            cachedFirstResponse = fullText;
            cachedSajuKey = currentSajuKey;
        } catch (e) {
            bubble.innerHTML = "하늘의 기운(서버)과 닿지 않고 있습니다. 잠시 후 다시 시도해주시지요.";
        }
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendChatMessage('user', text);
        chatInput.value = '';

        // 빈 말풍선 생성 (스트리밍으로 채워질 예정)
        const botDiv = document.createElement('div');
        botDiv.classList.add('message', 'bot');
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = '...';
        botDiv.appendChild(bubble);
        chatBox.appendChild(botDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    sessionId: sessionId,
                    sajuInfo: isFirstMessage ? sajuInfo : null,
                    language: currentLang || 'ko'
                })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            bubble.innerHTML = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const text = line.slice(6);
                        if (text === '[DONE]') continue;
                        fullText += text;
                        bubble.innerHTML = fullText.replace(/\n/g, '<br>');
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                }
            }
            isFirstMessage = false;
        } catch (e) {
            bubble.innerHTML = getTranslation('chatError');
        }
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
});
