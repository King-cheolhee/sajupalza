// ==============================
// 다국어 번역 사전 (i18n)
// 지원 언어: ko(한국어), en(영어), ja(일본어), zh(중국어)
// ==============================

const TRANSLATIONS = {
    ko: {
        // 네비게이션
        navTitle: "사주팔자",
        navForward: "결과보기 ⟩",
        navResult: "명식 대조(對照)",

        // 입력 화면
        introText: "한치 앞을 모르는 인생의 길, 알고 가면 쉬워집니다.",
        labelName: "이름",
        placeholderName: "성함을 기입해 주십시오",
        labelGender: "성별",
        genderFemale: "여성 (坤)",
        genderMale: "남성 (乾)",
        labelBirthInfo: "생년월일시",
        btn12Ganji: "12간지 시간표 🔍",
        labelCalendar: "역법",
        calSolar: "양력 (陽曆)",
        calLunar: "음력 (陰曆)",
        labelDate: "날짜",
        placeholderDate: "YYYY-MM-DD (숫자 8자리 기입)",
        labelTime: "시간",
        amLabel: "오전",
        pmLabel: "오후",
        placeholderTime: "예) 14:30",
        unknownTime: "시간 모름",
        yajaTime: "야자시/조자시",
        submitBtn: "사주풀이 시작",

        // 로딩
        loadingText: "사주팔자를 분석합니다...",

        // 결과 화면
        chatHeader: "명리 심층 분석 (도사님 대화)",
        chatWelcome: "사주 8글자 셋업을 완료했습니다. <br>금년의 길흉화복이나 평생지기의 조언 등 편하게 질문해 주십시오.",
        chatPlaceholder: "조언을 구해봅니다...",
        chatSendBtn: "여쭙기",
        chatError: "하늘의 기운(서버)과 닿지 않고 있습니다. 잠시 후 다시 시도해주시지요.",
        tableHeader: ["", "생시", "생일", "생월", "생년"],
        rowLabels: { chungan: "천간", jiJi: "지지", sipsung: "십성", jiJangGan: "지장간", ship2: "12운성" },

        // About
        aboutTitle: "도향(道香)이란?",
        aboutDesc1: "도향(道香)은 AI 기반 무료 사주팔자 상담 서비스입니다. 생년월일시를 입력하시면 만세력을 기반으로 사주팔자를 분석하고, AI 사주 전문가 '도향 선생'이 대화형으로 운세를 풀어드립니다.",
        aboutDesc2: '기존의 운세 서비스와 달리, 일방적인 결과 제공이 아닌 <strong>1:1 상담 형태</strong>로 진행되어 궁금한 점을 자유롭게 질문하실 수 있습니다.',
        aboutFeatures: [
            "회원가입 없이 무료로 이용 가능",
            "AI 기반 대화형 사주 상담",
            "올해 운세, 직장운, 연애운, 결혼운 등 상담",
            "만세력 기반 사주팔자 명식 제공"
        ],

        // FAQ
        faqTitle: "자주 묻는 질문 (FAQ)",
        faqItems: [
            { q: "Q. 이 서비스는 무료인가요?", a: "네, 도향(道香)은 완전 무료 서비스입니다. 회원가입이나 결제 없이 바로 이용하실 수 있습니다." },
            { q: "Q. 사주풀이 결과는 정확한가요?", a: "도향은 전통 사주명리학의 원리(오행, 십신, 12운성 등)를 기반으로 AI가 분석합니다. 재미와 참고 목적으로 이용해 주시기 바라며, 중요한 결정은 반드시 전문가와 상의하시기 바랍니다." },
            { q: "Q. 어떤 정보를 입력해야 하나요?", a: "이름, 성별, 생년월일, 태어난 시간을 입력합니다. 태어난 시간을 모르시면 '시간 모름'을 체크하고 이용하실 수 있습니다." },
            { q: "Q. 양력과 음력 중 어떤 것을 선택해야 하나요?", a: "주민등록등본 또는 출생증명서에 기재된 역법을 기준으로 선택해 주세요. 일반적으로 병원 출생 기록은 양력입니다." },
            { q: "Q. 개인정보는 안전한가요?", a: "입력하신 정보는 사주 분석 목적으로만 사용되며, 서버에 영구 저장되지 않습니다. 대화가 종료되면 세션 데이터는 자동으로 삭제됩니다." },
            { q: "Q. AI가 어떤 운세를 봐주나요?", a: "사업운/직장운, 결혼운, 연애운, 행운 및 주의 시기 등 4가지 카테고리를 중심으로 상담하며, 자유 질문도 가능합니다." }
        ],

        // Policy
        policyTitle: "이용 안내",
        disclaimerTitle: "면책조항",
        disclaimerText: '본 서비스는 전통 사주명리학을 기반으로 한 AI 엔터테인먼트 서비스이며, <strong>재미와 참고 목적</strong>으로 제공됩니다. 본 서비스의 상담 내용은 의학적, 법률적, 재정적 전문 조언을 대체하지 않습니다.',
        privacyTitle: "개인정보처리방침",
        privacyItems: [
            { label: "수집하는 정보:", text: "이름, 성별, 생년월일, 태어난 시간 (사주 분석 목적에 한함)" },
            { label: "정보의 이용:", text: "입력하신 정보는 AI 사주 분석을 위한 목적으로만 사용됩니다." },
            { label: "정보의 보관:", text: "입력 정보는 서버 메모리에 임시 저장되며, 세션 종료 시 자동으로 삭제됩니다." },
            { label: "제3자 제공:", text: "수집된 개인정보는 어떠한 제3자에게도 제공되지 않습니다." },
            { label: "문의:", text: "서비스 관련 문의는 이메일(contact@dohyang.com)로 연락 주시기 바랍니다." }
        ],

        // Footer
        footerCopyright: "© 2026 도향(道香) — AI 사주명리 상담 서비스",
        footerAbout: "서비스 소개",
        footerFaq: "자주 묻는 질문",
        footerPrivacy: "개인정보처리방침",
        footerDisclaimer: "본 서비스는 재미와 참고 목적으로 제공되며, 전문적인 상담을 대체하지 않습니다.",

        // 12간지 모달
        modal12Title: "12간지 시간표 (十二支)",
        modalYajaTitle: "야자시와 조자시의 구분",
        modalConfirm: "확인"
    },

    en: {
        navTitle: "Four Pillars",
        navForward: "Results ⟩",
        navResult: "Destiny Chart",
        introText: "Life's path is uncertain — knowing your destiny makes it easier.",
        labelName: "Name",
        placeholderName: "Enter your name",
        labelGender: "Gender",
        genderFemale: "Female (坤)",
        genderMale: "Male (乾)",
        labelBirthInfo: "Date & Time of Birth",
        btn12Ganji: "12 Branches Chart 🔍",
        labelCalendar: "Calendar",
        calSolar: "Solar (陽曆)",
        calLunar: "Lunar (陰曆)",
        labelDate: "Date",
        placeholderDate: "YYYY-MM-DD",
        labelTime: "Time",
        amLabel: "AM",
        pmLabel: "PM",
        placeholderTime: "HH:MM",
        unknownTime: "Time unknown",
        yajaTime: "Yaja-si / Joja-si",
        submitBtn: "Start Reading",
        loadingText: "Analyzing your Four Pillars...",
        chatHeader: "Destiny Reading (AI Consultation)",
        chatWelcome: "Your Four Pillars chart is ready.<br>Feel free to ask about this year's fortune, career, love, or anything on your mind.",
        chatPlaceholder: "Ask your question...",
        chatSendBtn: "Ask",
        chatError: "Unable to connect to the server. Please try again shortly.",
        tableHeader: ["", "Hour", "Day", "Month", "Year"],
        rowLabels: { chungan: "Heavenly Stems", jiJi: "Earthly Branches", sipsung: "Ten Gods", jiJangGan: "Hidden Stems", ship2: "12 Stages" },
        aboutTitle: "What is DoHyang (道香)?",
        aboutDesc1: "DoHyang is a free AI-powered Four Pillars of Destiny (Saju) consultation service. Enter your date and time of birth, and our AI master 'DoHyang' will analyze your destiny chart and provide personalized fortune reading through interactive conversation.",
        aboutDesc2: 'Unlike traditional fortune-telling services, DoHyang offers <strong>1-on-1 interactive consultation</strong> where you can freely ask questions about your destiny.',
        aboutFeatures: [
            "Completely free, no registration required",
            "AI-powered interactive consultation",
            "Career, love, marriage, and fortune readings",
            "Traditional Saju chart provided"
        ],
        faqTitle: "Frequently Asked Questions (FAQ)",
        faqItems: [
            { q: "Q. Is this service free?", a: "Yes, DoHyang is completely free. You can use it immediately without registration or payment." },
            { q: "Q. How accurate are the readings?", a: "DoHyang is based on traditional East Asian fortune-telling principles (Five Elements, Ten Gods, 12 Stages). Please use it for entertainment and reference only. For important decisions, always consult with professionals." },
            { q: "Q. What information do I need to provide?", a: "Name, gender, date of birth, and time of birth. If you don't know your birth time, you can check 'Time unknown'." },
            { q: "Q. Should I use Solar or Lunar calendar?", a: "Use the calendar type listed on your birth certificate. Hospital records typically use the Solar calendar." },
            { q: "Q. Is my personal information safe?", a: "Your information is used solely for fortune analysis and is not permanently stored. Session data is automatically deleted when the conversation ends." },
            { q: "Q. What kind of readings does the AI provide?", a: "Four main categories: Career/Business, Marriage, Romance, and Lucky/Cautious periods. Free-form questions are also welcome." }
        ],
        policyTitle: "Terms of Use",
        disclaimerTitle: "Disclaimer",
        disclaimerText: 'This service is an AI entertainment service based on traditional East Asian astrology, provided for <strong>fun and reference purposes</strong>. The consultation does not replace professional medical, legal, or financial advice.',
        privacyTitle: "Privacy Policy",
        privacyItems: [
            { label: "Information collected:", text: "Name, gender, date of birth, time of birth (for fortune analysis only)" },
            { label: "Use of information:", text: "Your information is used solely for AI fortune analysis." },
            { label: "Data retention:", text: "Information is temporarily stored in server memory and automatically deleted when the session ends." },
            { label: "Third-party sharing:", text: "Collected personal information is not shared with any third parties." },
            { label: "Contact:", text: "For inquiries, please email contact@dohyang.com." }
        ],
        footerCopyright: "© 2026 DoHyang (道香) — AI Fortune Reading Service",
        footerAbout: "About",
        footerFaq: "FAQ",
        footerPrivacy: "Privacy Policy",
        footerDisclaimer: "This service is for entertainment and reference only and does not replace professional consultation.",
        modal12Title: "12 Earthly Branches Time Chart",
        modalYajaTitle: "Yaja-si and Joja-si Distinction",
        modalConfirm: "OK"
    },

    ja: {
        navTitle: "四柱推命",
        navForward: "結果を見る ⟩",
        navResult: "命式照合",
        introText: "人生の道は先が見えません。運命を知れば、歩みやすくなります。",
        labelName: "お名前",
        placeholderName: "お名前をご記入ください",
        labelGender: "性別",
        genderFemale: "女性 (坤)",
        genderMale: "男性 (乾)",
        labelBirthInfo: "生年月日時",
        btn12Ganji: "十二支 時刻表 🔍",
        labelCalendar: "暦法",
        calSolar: "新暦 (陽曆)",
        calLunar: "旧暦 (陰曆)",
        labelDate: "日付",
        placeholderDate: "YYYY-MM-DD",
        labelTime: "時刻",
        amLabel: "午前",
        pmLabel: "午後",
        placeholderTime: "HH:MM",
        unknownTime: "時刻不明",
        yajaTime: "夜子時/朝子時",
        submitBtn: "鑑定を開始",
        loadingText: "四柱八字を分析中...",
        chatHeader: "命理深層分析（先生との対話）",
        chatWelcome: "四柱八字のセットアップが完了しました。<br>今年の運勢やお悩みなど、お気軽にご質問ください。",
        chatPlaceholder: "ご質問をどうぞ...",
        chatSendBtn: "質問する",
        chatError: "サーバーに接続できません。しばらくしてから再度お試しください。",
        tableHeader: ["", "時柱", "日柱", "月柱", "年柱"],
        rowLabels: { chungan: "天干", jiJi: "地支", sipsung: "十神", jiJangGan: "蔵干", ship2: "十二運" },
        aboutTitle: "道香（どうこう）とは？",
        aboutDesc1: "道香は、AI搭載の無料四柱推命鑑定サービスです。生年月日時を入力すると、AI鑑定師「道香先生」が対話形式で運勢を読み解きます。",
        aboutDesc2: '従来の占いサービスとは異なり、<strong>1対1の対話形式</strong>で、気になることを自由にご質問いただけます。',
        aboutFeatures: [
            "会員登録不要・完全無料",
            "AI搭載の対話型鑑定",
            "今年の運勢、仕事運、恋愛運、結婚運など",
            "伝統的な四柱八字命式を提供"
        ],
        faqTitle: "よくある質問（FAQ）",
        faqItems: [
            { q: "Q. このサービスは無料ですか？", a: "はい、道香は完全無料です。会員登録や支払いなしですぐにご利用いただけます。" },
            { q: "Q. 鑑定結果は正確ですか？", a: "道香は伝統的な四柱推命の原理に基づいてAIが分析します。娯楽と参考目的でご利用ください。重要な決定は必ず専門家にご相談ください。" },
            { q: "Q. どんな情報を入力しますか？", a: "お名前、性別、生年月日、生まれた時刻を入力します。時刻が分からない場合は「時刻不明」をチェックしてください。" },
            { q: "Q. 新暦と旧暦、どちらを選べばいいですか？", a: "出生届に記載されている暦法を基準にお選びください。通常、病院の記録は新暦です。" },
            { q: "Q. 個人情報は安全ですか？", a: "入力された情報は鑑定目的のみに使用され、サーバーに永久保存されません。セッション終了時に自動的に削除されます。" },
            { q: "Q. AIはどんな鑑定をしてくれますか？", a: "仕事運、結婚運、恋愛運、幸運/注意時期の4つのカテゴリを中心に鑑定し、自由な質問も可能です。" }
        ],
        policyTitle: "ご利用案内",
        disclaimerTitle: "免責事項",
        disclaimerText: '本サービスは伝統的な四柱推命に基づくAIエンターテインメントサービスであり、<strong>娯楽と参考目的</strong>で提供されます。専門的な医療・法律・財務アドバイスに代わるものではありません。',
        privacyTitle: "プライバシーポリシー",
        privacyItems: [
            { label: "収集する情報:", text: "お名前、性別、生年月日、生まれた時刻（鑑定目的に限る）" },
            { label: "情報の利用:", text: "入力された情報はAI鑑定のためのみに使用されます。" },
            { label: "情報の保管:", text: "入力情報はサーバーメモリに一時保存され、セッション終了時に自動削除されます。" },
            { label: "第三者提供:", text: "収集した個人情報は第三者に提供されません。" },
            { label: "お問い合わせ:", text: "contact@dohyang.comまでご連絡ください。" }
        ],
        footerCopyright: "© 2026 道香（どうこう） — AI四柱推命鑑定サービス",
        footerAbout: "サービス紹介",
        footerFaq: "よくある質問",
        footerPrivacy: "プライバシーポリシー",
        footerDisclaimer: "本サービスは娯楽と参考目的で提供され、専門的な相談に代わるものではありません。",
        modal12Title: "十二支 時刻表",
        modalYajaTitle: "夜子時と朝子時の区分",
        modalConfirm: "確認"
    },

    zh: {
        navTitle: "四柱八字",
        navForward: "查看结果 ⟩",
        navResult: "命盘对照",
        introText: "人生之路迷雾重重，知命者行路更从容。",
        labelName: "姓名",
        placeholderName: "请输入您的姓名",
        labelGender: "性别",
        genderFemale: "女 (坤)",
        genderMale: "男 (乾)",
        labelBirthInfo: "出生日期与时辰",
        btn12Ganji: "十二地支时辰表 🔍",
        labelCalendar: "历法",
        calSolar: "阳历 (陽曆)",
        calLunar: "阴历 (陰曆)",
        labelDate: "日期",
        placeholderDate: "YYYY-MM-DD",
        labelTime: "时间",
        amLabel: "上午",
        pmLabel: "下午",
        placeholderTime: "HH:MM",
        unknownTime: "时辰不详",
        yajaTime: "夜子时/朝子时",
        submitBtn: "开始排盘",
        loadingText: "正在分析四柱八字...",
        chatHeader: "命理深度分析（大师对话）",
        chatWelcome: "八字排盘已完成。<br>请随意询问今年运势、事业、感情等任何问题。",
        chatPlaceholder: "请输入您的问题...",
        chatSendBtn: "提问",
        chatError: "无法连接服务器，请稍后再试。",
        tableHeader: ["", "时柱", "日柱", "月柱", "年柱"],
        rowLabels: { chungan: "天干", jiJi: "地支", sipsung: "十神", jiJangGan: "藏干", ship2: "十二运" },
        aboutTitle: "道香是什么？",
        aboutDesc1: "道香是一款基于AI的免费四柱八字命理咨询服务。输入出生日期和时辰，AI命理大师'道香先生'将以对话形式为您解读命运。",
        aboutDesc2: '与传统算命服务不同，道香采用<strong>1对1对话形式</strong>，您可以自由提出任何疑问。',
        aboutFeatures: [
            "无需注册，完全免费",
            "AI驱动的对话式咨询",
            "今年运势、事业运、感情运、婚姻运等",
            "提供传统四柱八字命盘"
        ],
        faqTitle: "常见问题（FAQ）",
        faqItems: [
            { q: "Q. 这项服务是免费的吗？", a: "是的，道香完全免费。无需注册或付费即可立即使用。" },
            { q: "Q. 分析结果准确吗？", a: "道香基于传统四柱推命原理由AI进行分析。请以娱乐和参考为目的使用，重要决定请务必咨询专业人士。" },
            { q: "Q. 需要输入什么信息？", a: "姓名、性别、出生日期和出生时间。如果不知道出生时间，可以勾选'时辰不详'。" },
            { q: "Q. 应该选择阳历还是阴历？", a: "请根据出生证明上记载的历法选择。通常医院记录使用阳历。" },
            { q: "Q. 个人信息安全吗？", a: "您输入的信息仅用于命理分析，不会永久存储在服务器上。会话结束时数据将自动删除。" },
            { q: "Q. AI能分析哪些运势？", a: "主要围绕事业运、婚姻运、感情运、吉凶时期四个类别进行分析，也支持自由提问。" }
        ],
        policyTitle: "使用须知",
        disclaimerTitle: "免责声明",
        disclaimerText: '本服务是基于传统四柱推命的AI娱乐服务，仅供<strong>娱乐和参考</strong>之用。本服务的咨询内容不能替代专业的医疗、法律或财务建议。',
        privacyTitle: "隐私政策",
        privacyItems: [
            { label: "收集的信息：", text: "姓名、性别、出生日期、出生时间（仅限命理分析目的）" },
            { label: "信息使用：", text: "您输入的信息仅用于AI命理分析。" },
            { label: "信息保存：", text: "输入信息临时保存在服务器内存中，会话结束时自动删除。不进行数据库永久存储。" },
            { label: "第三方共享：", text: "收集的个人信息不会提供给任何第三方。" },
            { label: "联系方式：", text: "如有疑问请发送邮件至 contact@dohyang.com。" }
        ],
        footerCopyright: "© 2026 道香 — AI四柱推命咨询服务",
        footerAbout: "关于我们",
        footerFaq: "常见问题",
        footerPrivacy: "隐私政策",
        footerDisclaimer: "本服务仅供娱乐和参考，不能替代专业咨询。",
        modal12Title: "十二地支时辰表",
        modalYajaTitle: "夜子时与朝子时的区分",
        modalConfirm: "确认"
    }
};

// 현재 언어 (기본값: 한국어)
let currentLang = localStorage.getItem('dohyang-lang') || 'ko';

// 언어 전환 함수
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('dohyang-lang', lang);
    applyTranslations();
}

// 번역 적용 함수
function applyTranslations() {
    const t = TRANSLATIONS[currentLang];
    if (!t) return;

    // data-i18n 속성을 가진 요소들 자동 번역
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else if (el.tagName === 'OPTION') {
                el.textContent = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });

    // FAQ 동적 렌더링
    const faqContainer = document.getElementById('faq-container');
    if (faqContainer && t.faqItems) {
        faqContainer.innerHTML = t.faqItems.map(item =>
            `<div class="faq-item">
                <h3 class="faq-q">${item.q}</h3>
                <p class="faq-a">${item.a}</p>
            </div>`
        ).join('');
    }

    // About 기능 목록 렌더링
    const featureList = document.getElementById('about-features');
    if (featureList && t.aboutFeatures) {
        featureList.innerHTML = t.aboutFeatures.map(f => `<li>${f}</li>`).join('');
    }

    // Privacy 항목 렌더링
    const privacyList = document.getElementById('privacy-items');
    if (privacyList && t.privacyItems) {
        privacyList.innerHTML = t.privacyItems.map(item =>
            `<p><strong>${item.label}</strong> ${item.text}</p>`
        ).join('');
    }

    // 푸터 링크
    const footerLinks = document.getElementById('footer-links');
    if (footerLinks) {
        footerLinks.innerHTML = `
            <a href="#about-section">${t.footerAbout}</a> |
            <a href="#faq-section">${t.footerFaq}</a> |
            <a href="#policy-section">${t.footerPrivacy}</a>
        `;
    }

    // 언어 선택 드롭다운 활성 표시
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
}

// 현재 언어의 번역 텍스트 가져오기
function getTranslation(key) {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['ko'][key] || key;
}
