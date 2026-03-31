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
        const baseDate = new Date(1900, 0, 1); // 1900-01-01
        const targetDate = new Date(year, month - 1, day);
        const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

        // 1900-01-01 = 경자일 (stem=6[경], branch=0[자])
        const stemIdx = ((diffDays % 10) + 6) % 10;
        const branchIdx = ((diffDays % 12) + 0) % 12;

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

        // 시지(時支) 결정 (2시간 단위)
        let hourBranch;
        if (totalMinutes >= 1410 || totalMinutes < 90) hourBranch = 0;       // 자시 23:30~01:30
        else if (totalMinutes < 210) hourBranch = 1;   // 축시 01:30~03:30
        else if (totalMinutes < 330) hourBranch = 2;   // 인시 03:30~05:30
        else if (totalMinutes < 450) hourBranch = 3;   // 묘시 05:30~07:30
        else if (totalMinutes < 570) hourBranch = 4;   // 진시 07:30~09:30
        else if (totalMinutes < 690) hourBranch = 5;   // 사시 09:30~11:30
        else if (totalMinutes < 810) hourBranch = 6;   // 오시 11:30~13:30
        else if (totalMinutes < 930) hourBranch = 7;   // 미시 13:30~15:30
        else if (totalMinutes < 1050) hourBranch = 8;  // 신시 15:30~17:30
        else if (totalMinutes < 1170) hourBranch = 9;  // 유시 17:30~19:30
        else if (totalMinutes < 1290) hourBranch = 10; // 술시 19:30~21:30
        else hourBranch = 11;                           // 해시 21:30~23:30

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

        return formatted;
    }

    /**
     * HTML 테이블로 만세력 렌더링 (이전 디자인: 천간/지지/십성 3행)
     */
    function renderHTML(saju) {
        const cell = (hanja, hangul, ohaeng, extra) =>
            `<td class="saju-cell${extra || ''}">
                <span class="saju-hanja">${hanja}</span>
                <span class="saju-hangul">${hangul}</span>
                <span class="saju-ohaeng">${ohaeng}</span>
                ${extra === ' saju-me' ? '<span class="saju-me-label">나</span>' : ''}
            </td>`;

        const emptyCell = `<td class="saju-cell saju-unknown">?</td>`;
        const sipsinCell = (text) => `<td class="saju-sipsin">${text || ''}</td>`;

        return `
        <div class="saju-chart">
            <table class="saju-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>시주(時)</th>
                        <th>일주(日)</th>
                        <th>월주(月)</th>
                        <th>연주(年)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="saju-row-stem">
                        <th class="saju-row-label">천간</th>
                        ${saju.hour ? cell(saju.hour.stemHanja, saju.hour.stem, saju.hour.stemOhaeng) : emptyCell}
                        ${cell(saju.day.stemHanja, saju.day.stem, saju.day.stemOhaeng, ' saju-me')}
                        ${cell(saju.month.stemHanja, saju.month.stem, saju.month.stemOhaeng)}
                        ${cell(saju.year.stemHanja, saju.year.stem, saju.year.stemOhaeng)}
                    </tr>
                    <tr class="saju-row-branch">
                        <th class="saju-row-label">지지</th>
                        ${saju.hour ? cell(saju.hour.branchHanja, saju.hour.branch, saju.hour.branchOhaeng) : emptyCell}
                        ${cell(saju.day.branchHanja, saju.day.branch, saju.day.branchOhaeng)}
                        ${cell(saju.month.branchHanja, saju.month.branch, saju.month.branchOhaeng)}
                        ${cell(saju.year.branchHanja, saju.year.branch, saju.year.branchOhaeng)}
                    </tr>
                    <tr class="saju-row-sipsin">
                        <th class="saju-row-label">십성</th>
                        ${sipsinCell(saju.hourSipsin)}
                        ${sipsinCell('일간')}
                        ${sipsinCell(saju.monthSipsin)}
                        ${sipsinCell(saju.yearSipsin)}
                    </tr>
                </tbody>
            </table>
            <p class="saju-tti">${saju.tti}띠 · 일간 <b>${saju.ilgan}(${saju.ilganHanja})</b></p>
        </div>`;
    }

    return { calculate, renderHTML };
})();
