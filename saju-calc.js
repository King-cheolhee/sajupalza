/**
 * saju-calc.js — 만세력(사주 원국) 계산 모듈
 * 양력 생년월일시 → 연주·월주·일주·시주 (천간·지지) 계산
 */

const SajuCalc = (() => {
    // 천간 (天干) 10개
    const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const CHEONGAN_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

    // 지지 (地支) 12개
    const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const JIJI_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    // 오행 매핑 (천간)
    const CHEONGAN_OHAENG = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
    // 오행 매핑 (지지)
    const JIJI_OHAENG = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];

    // 띠 동물
    const TTI = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

    // 십신 (十神) 이름 — 일간 기준 오프셋 순서
    const SIPSIN = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];

    // 절기 기반 월 경계 (양력 기준 대략적 날짜, 일(day) 기준)
    // 각 월의 절기 시작일 (근사치)
    const JEOLGI_DAYS = [
        { month: 1, day: 6 },   // 소한 → 축월
        { month: 2, day: 4 },   // 입춘 → 인월
        { month: 3, day: 6 },   // 경칩 → 묘월
        { month: 4, day: 5 },   // 청명 → 진월
        { month: 5, day: 6 },   // 입하 → 사월
        { month: 6, day: 6 },   // 망종 → 오월
        { month: 7, day: 7 },   // 소서 → 미월
        { month: 8, day: 7 },   // 입추 → 신월
        { month: 9, day: 8 },   // 백로 → 유월
        { month: 10, day: 8 },  // 한로 → 술월
        { month: 11, day: 7 },  // 입동 → 해월
        { month: 12, day: 7 }   // 대설 → 자월
    ];

    /**
     * 양력 날짜로부터 절기 기준 월 인덱스 구하기 (0=인월, 1=묘월, ... 11=축월)
     * 반환: 0~11 (인월부터 시작)
     */
    function getJeolgiMonthIndex(year, month, day) {
        // 절기 월 매핑: 인(2), 묘(3), 진(4), 사(5), 오(6), 미(7), 신(8), 유(9), 술(10), 해(11), 자(12), 축(1)
        // 지지 인덱스: 인=2, 묘=3, 진=4, 사=5, 오=6, 미=7, 신=8, 유=9, 술=10, 해=11, 자=0, 축=1

        for (let i = 11; i >= 0; i--) {
            const jg = JEOLGI_DAYS[i];
            if (month > jg.month || (month === jg.month && day >= jg.day)) {
                // 이 절기 이후
                // i=0(소한→축월), i=1(입춘→인월), ...
                return i;
            }
        }
        // 1월 소한 이전 → 전년도 자월(12월 대설~)
        return 11; // 자월에 해당하지만 전년도 처리 필요
    }

    /**
     * 연주 (年柱) 계산
     * 입춘(2월 4일경) 이전이면 전년도 연주 사용
     */
    function getYearPillar(year, month, day) {
        let adjustedYear = year;
        // 입춘 이전이면 전년도
        if (month < 2 || (month === 2 && day < 4)) {
            adjustedYear -= 1;
        }
        const stemIdx = (adjustedYear - 4) % 10;
        const branchIdx = (adjustedYear - 4) % 12;
        return {
            stem: (stemIdx + 10) % 10,
            branch: (branchIdx + 12) % 12
        };
    }

    /**
     * 월주 (月柱) 계산
     * 연간(年干)에 따라 월간이 결정됨 (년간 × 5 시작 규칙)
     */
    function getMonthPillar(year, month, day) {
        const yearPillar = getYearPillar(year, month, day);
        const jeolgiIdx = getJeolgiMonthIndex(year, month, day);

        // 절기 인덱스 → 지지 매핑
        // jeolgiIdx: 0=축(소한), 1=인(입춘), 2=묘(경칩), ...
        const branchMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; // 축,인,묘,진,사,오,미,신,유,술,해,자
        const monthBranch = branchMap[jeolgiIdx];

        // 월간 계산: 연간 기준 (갑기→병인월, 을경→무인월, 병신→경인월, 정임→임인월, 무계→갑인월)
        const yearStemGroup = yearPillar.stem % 5;
        const startStem = (yearStemGroup * 2 + 2) % 10; // 인월의 천간

        // 인월(지지 2)부터의 오프셋 계산
        let monthOffset = monthBranch - 2;
        if (monthOffset < 0) monthOffset += 12;

        const monthStem = (startStem + monthOffset) % 10;

        return {
            stem: monthStem,
            branch: monthBranch
        };
    }

    /**
     * 일주 (日柱) 계산
     * 기준일(1900년 1월 1일 = 갑자일)로부터의 날짜 차이로 계산
     */
    function getDayPillar(year, month, day) {
        // 기준: 1900년 1월 1일 = 갑자(甲子)일 → stem=0, branch=0
        // 실제 1900-01-01은 경자(庚子)일임. 보정값 적용
        // UTC 기반으로 날짜 차이 계산 (타임존 문제 방지)
        const baseDate = Date.UTC(1900, 0, 1);
        const targetDate = Date.UTC(year, month - 1, day);
        const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

        // 1900-01-01 = 갑술일 (stem=0[갑], branch=10[술])
        const stemIdx = ((diffDays % 10) + 0) % 10;
        const branchIdx = ((diffDays % 12) + 10) % 12;

        return {
            stem: (stemIdx + 10) % 10,
            branch: (branchIdx + 12) % 12
        };
    }

    /**
     * 시주 (時柱) 계산
     * 일간(日干)에 따라 시간의 천간이 결정됨
     */
    function getHourPillar(year, month, day, hour, minute) {
        if (hour === null || hour === undefined) return null;

        const totalMinutes = hour * 60 + (minute || 0);

        // 시지(時支) 결정 (정시 기준, 2시간 단위)
        let hourBranch;
        if (totalMinutes >= 1380 || totalMinutes < 60) hourBranch = 0;        // 자시 23:00~01:00
        else if (totalMinutes < 180) hourBranch = 1;   // 축시 01:00~03:00
        else if (totalMinutes < 300) hourBranch = 2;   // 인시 03:00~05:00
        else if (totalMinutes < 420) hourBranch = 3;   // 묘시 05:00~07:00
        else if (totalMinutes < 540) hourBranch = 4;   // 진시 07:00~09:00
        else if (totalMinutes < 660) hourBranch = 5;   // 사시 09:00~11:00
        else if (totalMinutes < 780) hourBranch = 6;   // 오시 11:00~13:00
        else if (totalMinutes < 900) hourBranch = 7;   // 미시 13:00~15:00
        else if (totalMinutes < 1020) hourBranch = 8;  // 신시 15:00~17:00
        else if (totalMinutes < 1140) hourBranch = 9;  // 유시 17:00~19:00
        else if (totalMinutes < 1260) hourBranch = 10; // 술시 19:00~21:00
        else hourBranch = 11;                           // 해시 21:00~23:00

        // 시간 계산: 일간 기준 (갑기→갑자시, 을경→병자시, 병신→무자시, 정임→경자시, 무계→임자시)
        const dayPillar = getDayPillar(year, month, day);
        const dayStemGroup = dayPillar.stem % 5;
        const startStem = (dayStemGroup * 2) % 10; // 자시의 천간
        const hourStem = (startStem + hourBranch) % 10;

        return {
            stem: hourStem,
            branch: hourBranch
        };
    }

    /**
     * 십신 계산 (일간 기준)
     * @param {number} dayStem - 일간 인덱스 (0~9)
     * @param {number} targetStem - 대상 천간 인덱스 (0~9)
     * @returns {string} 십신 이름
     */
    function getSipsin(dayStem, targetStem) {
        const diff = ((targetStem - dayStem) + 10) % 10;
        return SIPSIN[diff];
    }

    /**
     * 전체 사주 원국 계산
     */
    function calculate(year, month, day, hour, minute) {
        const yearP = getYearPillar(year, month, day);
        const monthP = getMonthPillar(year, month, day);
        const dayP = getDayPillar(year, month, day);
        const hourP = getHourPillar(year, month, day, hour, minute);

        const format = (pillar) => {
            if (!pillar) return null;
            return {
                stem: CHEONGAN[pillar.stem],
                stemHanja: CHEONGAN_HANJA[pillar.stem],
                branch: JIJI[pillar.branch],
                branchHanja: JIJI_HANJA[pillar.branch],
                stemOhaeng: CHEONGAN_OHAENG[pillar.stem],
                branchOhaeng: JIJI_OHAENG[pillar.branch],
                stemIdx: pillar.stem,
                text: CHEONGAN[pillar.stem] + JIJI[pillar.branch],
                hanjaText: CHEONGAN_HANJA[pillar.stem] + JIJI_HANJA[pillar.branch]
            };
        };

        const tti = TTI[yearP.branch];
        const formatted = {
            year: format(yearP),
            month: format(monthP),
            day: format(dayP),
            hour: format(hourP),
            tti: tti,
            ilgan: CHEONGAN[dayP.stem],
            ilganHanja: CHEONGAN_HANJA[dayP.stem]
        };

        // 십신 계산 (일간 기준)
        formatted.yearSipsin = getSipsin(dayP.stem, yearP.stem);
        formatted.monthSipsin = getSipsin(dayP.stem, monthP.stem);
        formatted.hourSipsin = hourP ? getSipsin(dayP.stem, hourP.stem) : null;

        // 지지 십신 계산 (지지의 본기 기준)
        // 지지 → 본기 천간 매핑: 자=계, 축=기, 인=갑, 묘=을, 진=무, 사=병, 오=정, 미=기, 신=경, 유=신, 술=무, 해=임
        const JIJI_BONGI = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];
        formatted.yearBranchSipsin = getSipsin(dayP.stem, JIJI_BONGI[yearP.branch]);
        formatted.monthBranchSipsin = getSipsin(dayP.stem, JIJI_BONGI[monthP.branch]);
        formatted.dayBranchSipsin = getSipsin(dayP.stem, JIJI_BONGI[dayP.branch]);
        formatted.hourBranchSipsin = hourP ? getSipsin(dayP.stem, JIJI_BONGI[hourP.branch]) : null;

        // 지장간 매핑 (각 지지의 여기/중기/정기)
        const JIJANGGAN = [
            '임계',   // 자: 임,계
            '계신기', // 축: 계,신,기
            '무병갑', // 인: 무,병,갑
            '갑을',   // 묘: 갑,을
            '을계무', // 진: 을,계,무
            '무경병', // 사: 무,경,병
            '병기정', // 오: 병,기,정
            '정을기', // 미: 정,을,기
            '무임경', // 신: 무,임,경
            '경신',   // 유: 경,신
            '신정무', // 술: 신,정,무
            '무갑임'  // 해: 무,갑,임
        ];
        formatted.yearJijanggan = JIJANGGAN[yearP.branch];
        formatted.monthJijanggan = JIJANGGAN[monthP.branch];
        formatted.dayJijanggan = JIJANGGAN[dayP.branch];
        formatted.hourJijanggan = hourP ? JIJANGGAN[hourP.branch] : '?';

        // 12운성 매핑 (일간 기준, 각 지지에 대한 12운성)
        const UNSUNG_NAMES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
        // 일간별 12운성 시작 지지 인덱스 (장생 위치)
        const UNSUNG_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 갑을병정무기경신임계
        const dayUnsungStart = UNSUNG_START[dayP.stem];
        const getUnsung = (branchIdx) => {
            const offset = (branchIdx - dayUnsungStart + 12) % 12;
            return UNSUNG_NAMES[offset];
        };
        formatted.yearUnsung = getUnsung(yearP.branch);
        formatted.monthUnsung = getUnsung(monthP.branch);
        formatted.dayUnsung = getUnsung(dayP.branch);
        formatted.hourUnsung = hourP ? getUnsung(hourP.branch) : '?';

        return formatted;
    }

    /**
     * HTML 테이블로 만세력 렌더링 (이전 디자인 복원: 7행 완전 테이블)
     */
    function renderHTML(saju) {
        // 오행별 색상 클래스 매핑
        const OHAENG_COLOR = {
            '목': '#15803d', '화': '#dc2626', '토': '#a16207', '금': '#475569', '수': '#2563eb'
        };
        const OHAENG_BG = {
            '목': '#f0fdf4', '화': '#fef2f2', '토': '#fefce8', '금': '#f1f5f9', '수': '#eff6ff'
        };
        // 음양 표시 (천간: 갑병무경임=양, 을정기신계=음 / 지지: 자인진오신술=양, 축묘사미유해=음)
        const stemYinYang = (idx) => idx % 2 === 0 ? '+' : '-';
        const branchYinYang = (idx) => idx % 2 === 0 ? '+' : '-';

        const stemCell = (pillar, isMe) => {
            if (!pillar) return '<td class="m-cell m-unknown">?</td>';
            const color = OHAENG_COLOR[pillar.stemOhaeng] || '#333';
            const bg = isMe ? (OHAENG_BG[pillar.stemOhaeng] || '#fff') : 'transparent';
            const yy = stemYinYang(pillar.stemIdx);
            return `<td class="m-cell" style="background:${bg}">
                <span class="m-yy" style="color:${color}">${yy}${pillar.stemOhaeng}</span>
                <span class="m-hanja" style="color:${color}">${pillar.stemHanja}</span>
                <span class="m-hangul" style="color:${color}">${pillar.stem}</span>
            </td>`;
        };

        const branchCell = (pillar) => {
            if (!pillar) return '<td class="m-cell m-unknown">?</td>';
            const color = OHAENG_COLOR[pillar.branchOhaeng] || '#333';
            const bg = OHAENG_BG[pillar.branchOhaeng] || '#fff';
            const branchIdx = JIJI.indexOf(pillar.branch);
            const yy = branchYinYang(branchIdx >= 0 ? branchIdx : 0);
            return `<td class="m-cell" style="background:${bg}">
                <span class="m-yy" style="color:${color}">${yy}${pillar.branchOhaeng}</span>
                <span class="m-hanja" style="color:${color}">${pillar.branchHanja}</span>
                <span class="m-hangul" style="color:${color}">${pillar.branch}</span>
            </td>`;
        };

        const sipsinCell = (text, bg) =>
            `<td class="m-sipsin" style="background:${bg || '#f8f9fa'}">${text || ''}</td>`;

        const detailCell = (text) =>
            `<td class="m-detail">${text || ''}</td>`;

        // 십성 배경색 (천간십성은 연한 파랑, 지지십성은 연한 노랑)
        const stemSipBg = '#eef2ff';
        const branchSipBg = '#fefce8';

        return `
        <div class="saju-chart">
            <table class="m-table">
                <thead>
                    <tr>
                        <th class="m-label"></th>
                        <th>생시</th>
                        <th>생일</th>
                        <th>생월</th>
                        <th>생년</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="m-row-stem">
                        <th class="m-label">천간</th>
                        ${stemCell(saju.hour, false)}
                        ${stemCell(saju.day, true)}
                        ${stemCell(saju.month, false)}
                        ${stemCell(saju.year, false)}
                    </tr>
                    <tr class="m-row-sipsin">
                        <th class="m-label">십성</th>
                        ${sipsinCell(saju.hourSipsin, stemSipBg)}
                        ${sipsinCell('비견', stemSipBg)}
                        ${sipsinCell(saju.monthSipsin, stemSipBg)}
                        ${sipsinCell(saju.yearSipsin, stemSipBg)}
                    </tr>
                    <tr class="m-row-branch">
                        <th class="m-label">지지</th>
                        ${branchCell(saju.hour)}
                        ${branchCell(saju.day)}
                        ${branchCell(saju.month)}
                        ${branchCell(saju.year)}
                    </tr>
                    <tr class="m-row-sipsin">
                        <th class="m-label">십성</th>
                        ${sipsinCell(saju.hourBranchSipsin, branchSipBg)}
                        ${sipsinCell(saju.dayBranchSipsin, branchSipBg)}
                        ${sipsinCell(saju.monthBranchSipsin, branchSipBg)}
                        ${sipsinCell(saju.yearBranchSipsin, branchSipBg)}
                    </tr>
                    <tr class="m-row-detail">
                        <th class="m-label">지장간</th>
                        ${detailCell(saju.hourJijanggan)}
                        ${detailCell(saju.dayJijanggan)}
                        ${detailCell(saju.monthJijanggan)}
                        ${detailCell(saju.yearJijanggan)}
                    </tr>
                    <tr class="m-row-detail">
                        <th class="m-label">12운성</th>
                        ${detailCell(saju.hourUnsung)}
                        ${detailCell(saju.dayUnsung)}
                        ${detailCell(saju.monthUnsung)}
                        ${detailCell(saju.yearUnsung)}
                    </tr>
                </tbody>
            </table>
        </div>`;
    }

    return { calculate, renderHTML };
})();
