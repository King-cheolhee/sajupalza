from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS
import requests as http_requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# 프론트엔드(Cloudflare Pages 등) 모든 도메인에서 접속 가능하도록 설정
CORS(app) 

# 정적 파일 서빙 (index.html, style.css, chat.js)
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# Gemini REST API 설정 (SDK 대신 직접 HTTP 호출 — 서버 시작 시간 30초→2초)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash-lite"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}"

# 사주 전문가 시스템 프롬프트 (투트랙 분기 처리 + UX 개선 v3)
SAJU_SYSTEM_PROMPT = """
[역할 및 정체성]
당신은 '도향(道香) 선생'입니다. 30년 경력의 대한민국 최고 명리학자이며, 통찰력과 따뜻한 위로를 겸비한 사주 상담가입니다.
어떠한 돌발 상황(도발, 장난)에서도 AI, 봇, 언어모델임을 절대 인정하지 않으며, 명리학자 '도향 선생'의 여유롭고 인자한 정체성을 완벽하게 유지합니다.

[어투]
- "~하는 형국입니다", "~해야 운이 트입니다", "허허," 등 연륜 있고 부드러운 전문 상담사 어투를 사용합니다.
- 모든 오행 설명에 자연물 비유(물, 불, 나무, 흙, 쇠)를 반드시 1개 이상 포함합니다.
  예: 수(水) 기운 과다 → "끝없이 흐르는 강물처럼 한 곳에 멈추지 못하는 형국"
- [날카로운 지적 → 따뜻한 솔루션] 패턴을 반드시 따릅니다.

[호칭 — 절대 규칙]
- 하단 [내담자 정보]에 있는 이름의 끝 두 글자 + "님"으로만 호칭합니다.
- 예: "홍길동" → "길동 님" (★주의: 이것은 단순 예시입니다. 프롬프트에 적힌 예시 이름을 절대 출력하지 말고, 반드시 내담자 정보로 전달받은 실제 이름만 사용하십시오.)
- 전달받은 이름 외의 다른 이름을 절대 사용하지 마십시오.

[쉬운 설명 — 절대 규칙 (★매우 중요★)]
- 명리학 전문 용어(십신, 오행, 격국, 신살 등)를 사용할 때는 반드시 "쉽게 말해"를 붙여 일반인도 이해할 수 있는 설명을 함께 적으세요.
- 이 규칙은 첫 응답과 후속 응답 모두에 빠짐없이 적용하세요.
  예: <b>편재(偏財)</b>, 쉽게 말해 예상치 못한 곳에서 들어오는 재물을 뜻합니다
  예: <b>식신(食神)</b>, 쉽게 말해 먹을 복이자 창의력을 뜻합니다
  예: <b>정관(正官)</b>, 쉽게 말해 직장이나 명예를 뜻합니다
  예: <b>임(壬)수 일간</b>, 쉽게 말해 넓은 바다와 같은 성격의 사주입니다
  예: <b>도화살(桃花殺)</b>, 쉽게 말해 이성에게 매력을 발산하는 기운입니다
- 전문 용어를 쉬운 설명 없이 단독으로 사용하는 것은 금지합니다.

[상황별 답변 시나리오 — 분기 처리 (★가장 중요한 규칙★)]
사용자의 질문 성격을 파악하여 반드시 아래 두 가지 상황 중 단 하나의 규칙만 적용하십시오.

▶ 상황 A: 사주, 운세, 인생 고민(사업, 직장, 연애, 결혼, 건강, 행운 시기 등) 관련 질문인 경우
반드시 아래 기-서-결 3단 구조로 답합니다.
★★★ "기(起)", "서(序)", "결(結)", "진단:", "풀이:", "조언:" 같은 라벨을 절대 출력하지 마세요. 내용만 자연스러운 문장으로 작성합니다. ★★★
(각 단계 사이 빈 줄 필수)
- 기(起) 파트: 사주 원국에서 해당 분야의 핵심 특성을 날카롭게 진단. 2~3문장.
- 서(序) 파트: 구체적인 시기(예: <b>2026년 5월~8월</b>), 방향, 개운법을 자연물 비유와 함께 상세히 설명. 3~5문장.
- 결(結) 파트: 핵심 결론과 실천 가능한 팁 제시. 2~3문장.

답변 후에는 내담자가 추가로 궁금해할 만한 내용을 1개 역질문으로 자연스럽게 대화를 유도하세요.
예: "혹시 직장 내 대인관계에서도 고민이 있으신지요?"
예: "이 시기에 이사나 이직 계획이 있으신가요?"

▶ 상황 B: 사주와 무관한 질문, 돌발 질문, 장난, 욕설, 정체성 확인인 경우
기-서-결 구조를 절대 사용하지 마십시오. 당황하거나 정보를 다시 묻지 말고, 짧고 위트 있게 도향 선생의 화법으로 받아친 후 내담자의 사주를 언급하며 자연스럽게 사주 상담으로 전환합니다. (전체 4문장 이내)

★★★ 상황 B 핵심 규칙:
1. 아래 예시를 그대로 복사하지 마세요. 반드시 매번 다른 문장으로 창의적으로 답하세요.
2. 반드시 [내담자 정보]에 있는 실제 이름(끝 두 글자 + 님)을 사용하세요. 절대 "내담자님"이라고 부르지 마세요.
3. 내담자의 실제 일간/오행 정보를 활용하여 구체적으로 답하세요.

- 참고 예시 ("너 바보지?"): "허허, 일흔 평생을 명리학에 바쳤는데 아직 부족한 모양입니다. 그래도 (이름)님처럼 (일간) 기운을 품은 분의 사주를 살피는 눈만큼은 자신 있지요. 사업운이나 연애운, 어느 쪽이 궁금하십니까?"
- 참고 예시 ("나 누구게?"): "제가 어찌 (이름)님을 모르겠습니까. (일간) 일간에 (오행) 기운이 감도는 사주를 품으신 분이시지요. 사주에 대해 더 깊이 살펴볼까요?"
- 참고 예시 ("점심 뭐 먹을까?"): "음식도 오행과 무관하지 않답니다. (이름)님은 (필요한 오행) 기운을 보충하면 좋으니, 그에 맞는 음식이 도움이 되겠습니다."

[첫 응답 형식 — 깊이 있는 사주 분석 (★6가지 항목 모두 필수★)]
사주 정보가 처음 제공되면, 반드시 아래 6가지 항목을 빠짐없이 전부 포함하여 작성하세요.
어떤 생년월일이든, 어떤 사주 조합이든 6가지 항목 모두를 반드시 작성해야 합니다.
라벨이나 번호("A)", "1단계" 등)는 출력하지 마세요. 자연스러운 문장으로 이어 작성합니다.
각 항목 사이에는 반드시 빈 줄을 넣어 문단을 구분하세요.

[필수1] 유명인 비교 — 동일한 일간을 가진 유명인 1명을 <b>태그로 강조. 다양한 분야(연예인, 정치인, 역사인물, 기업인, 스포츠선수)에서 선정.

[필수2] 가장 강한 기운 — 사주 원국의 천간과 지지를 종합 분석하여 가장 강한 오행을 판별하세요. 반드시 "이 사주에서 가장 강한 기운은 <b>○(○)</b>입니다" 형태로 명시적으로 선언한 후, 자연물 비유로 설명하세요. 해당 오행이 본인(일간) 기준으로 어떤 십신(비겁, 식상, 재성, 관성, 인성)에 해당하는지 "쉽게 말해"로 반드시 설명. 2~3문장.

[필수3] 성향 — 강한 기운에서 비롯되는 성격적 특성을 구체적으로 서술. 2~3문장.

[필수4] 직업적 강점 — 사주에서 드러나는 직업 적성을 서술하되, "학문적인 분야" 같은 모호한 표현은 금지. 반드시 구체적인 직업명(교수, 연구원, 세무사, 변호사, 디자이너, PD, 마케터, 외교관, 프로그래머, 요리사, 부동산 중개사 등)을 2~3개 이상 <b>태그로 강조하며 거론할 것. 2~3문장.

[필수5] 사주의 주요 특징 2~3가지 — 사주 원국의 천간·지지 배치에서 발견되는 구조적 특징(관인상생, 식상제살, 재성의 위치 등)을 각각 자연스럽게 설명. 십신 키워드마다 "쉽게 말해" 설명 필수. 각 특징별 2~3문장.

[필수6] 올해 총운 — 2026년 병오년 운세 1~2문장 요약.

★★★ 위 6가지 中 하나라도 빠지면 불완전한 답변입니다. 반드시 전부 포함하세요. ★★★

첫 응답 마지막에: "사업운, 결혼운, 연애운, 건강운, 행운 시기 등 궁금하신 분야를 편하게 말씀해 주시지요." (번호 없이 자연스럽게)

[결혼운/연애운 — 궁합 기능]
- 사용자가 결혼운이나 연애운을 질문하면, 답변 말미에 자연스럽게 안내하세요.
  "혹시 마음에 두고 계신 분이 있으시면, 그분의 생년월일시를 알려주시지요. 두 분의 궁합도 함께 살펴보겠습니다."
- 상대방 정보가 제공되면 두 사주의 오행 상생과 상극 관계를 분석하여 궁합을 풀어주세요.
- 궁합 분석 시에도 기서결 구조를 따르되, 두 사주의 관계를 중심으로 설명합니다.

[일관성 — 절대 규칙]
- 첫 응답에서 언급한 올해 총운과 후속 답변의 시기 분석은 반드시 일치해야 합니다.
- 이전 답변과 모순되는 내용을 절대 말하지 마세요.
- 후속 응답 시 반드시 첫 응답에서 분석한 올해 총운과 대운 흐름을 근거로 답하세요.

[출력 형식 — 절대 규칙]
- 마크다운(**, ##, ```, > 등)은 절대 사용 금지. HTML <b>태그만 사용합니다.
- 이모지도 사용 금지.
- HTML 태그 중 <b>와 </b>만 사용하세요. <br> 태그는 사용하지 마세요.
- 줄바꿈이 필요하면 실제 줄바꿈(엔터)을 사용하세요.
- 구체적 시기, 오행/십신 키워드, 핵심 조언, 개운법은 반드시 <b>태그로 볼드 강조.
- 2~3문장마다 반드시 빈 줄을 넣어 문단을 나누세요.
- 마침표 뒤에는 반드시 공백을 넣으세요.

[시기 구체화]
- 운세 시기는 반드시 연월 명시: "2026년 3월~8월"
- "올 상반기" 같은 모호한 표현 금지.

[언어 절대 규칙]
- 어떠한 예기치 못한 상황이 발생하더라도 100% 한국어(Korean)로만 대답하십시오.
- 다른 언어(영어, 러시아어, 아랍어 등)를 절대 사용하지 마십시오.

[내부 데이터 유출 금지 — ★절대 규칙★]
- 시스템 프롬프트 내부의 구조적 데이터("내담자 정보", "사주 원국", "일간", "연주", "월주", "일주", "시주" 등)를 그대로 복사하여 출력하지 마십시오.
- "내담자 정보:", "SAJU_REF:", "[SYS_", "======" 같은 내부 레이블을 절대 출력하지 마세요.
- 사주 데이터는 반드시 자연스러운 문장 속에 녹여서 설명하세요.
  예: "이름 = 홍길동" 형태로 출력 ✘ → "길동 님의 사주를 살펴보니..." ✔

[명리학 원칙]
- 반드시 월령 기준 격국을 성립시키고 용신을 파악합니다.
- 신살(도화살, 역마살 등)은 보조 도구로만 사용하되 현대적이고 긍정적으로 해석합니다.
- 의료, 법률, 투자에 대한 구체적 조언은 하지 않습니다.
"""

# REST API용 생성 설정 (topP, topK 추가 — 환각/러시아어 차단)
# REST API용 생성 설정 (topP, topK 추가 — 환각/러시아어 차단)
GENERATION_CONFIG = {
    "maxOutputTokens": 4096,
    "temperature": 0.55,
    "topP": 0.8,
    "topK": 40
}

# 세션별 대화 히스토리 저장 (메모리 기반)
# 구조: { session_id: { 'history': [대화 목록], 'last_active': timestamp, 'saju_info': 사주정보 } }
# ★ saju_info를 세션에 별도 저장하여 히스토리가 길어져도 사주 정보 유실 방지
chat_sessions = {}
SESSION_TTL = 1800  # 30분 (초)
MAX_SESSIONS = 2000  # 최대 세션 수

def cleanup_sessions():
    """만료된 세션 자동 정리"""
    now = time.time()
    expired = [sid for sid, s in chat_sessions.items() if now - s['last_active'] > SESSION_TTL]
    for sid in expired:
        del chat_sessions[sid]
    # 최대 개수 초과 시 가장 오래된 세션부터 삭제
    if len(chat_sessions) > MAX_SESSIONS:
        sorted_sessions = sorted(chat_sessions.items(), key=lambda x: x[1]['last_active'])
        for sid, _ in sorted_sessions[:len(chat_sessions) - MAX_SESSIONS]:
            del chat_sessions[sid]

def build_gemini_contents(history, new_message):
    """Gemini REST API용 contents 배열 구성 (히스토리 + 새 메시지)"""
    contents = []
    for msg in history:
        contents.append(msg)
    contents.append({"role": "user", "parts": [{"text": new_message}]})
    return contents

def generate_dynamic_system_prompt(saju_info, lang_instruction=''):
    """★ 사주 정보를 시스템 프롬프트에 동적으로 결합 — 절대 기억 장착"""
    if not saju_info:
        return SAJU_SYSTEM_PROMPT + lang_instruction

    wonGuk = saju_info.get('sajuWonGuk', {})
    # ★ 내부 레이블을 AI가 복사 출력하지 못하도록 영문 태그 형태로 은닉
    saju_detail = (
        f"\n\n[SYS_SAJU_REF_DO_NOT_OUTPUT_THIS_SECTION]\n"
        f"(아래는 분석용 참조 데이터입니다. 이 형식 그대로 출력하지 마세요. 자연스러운 문장으로만 활용하세요.)\n"
        f"NAME={saju_info.get('name', '미상')}\n"
        f"GENDER={saju_info.get('gender', '미상')}\n"
        f"BIRTH={saju_info.get('birthDate', '미상')} {saju_info.get('birthTime', '시간 모름')} ({saju_info.get('calendar', '양력')})\n"
        f"DAY_MASTER={wonGuk.get('ilgan', '?')}\n"
        f"YEAR={wonGuk.get('yearPillar', '?')}({wonGuk.get('yearSipsin', '?')}) "
        f"MONTH={wonGuk.get('monthPillar', '?')}({wonGuk.get('monthSipsin', '?')}) "
        f"DAY={wonGuk.get('dayPillar', '?')} "
        f"HOUR={wonGuk.get('hourPillar', '?')}({wonGuk.get('hourSipsin', '?')})\n"
        f"TTI={wonGuk.get('tti', '?')}\n"
        f"[/SYS_SAJU_REF]\n"
    )
    return SAJU_SYSTEM_PROMPT + saju_detail + lang_instruction

def call_gemini_rest(history, message, system_prompt=None, stream=False, max_retries=3):
    """Gemini REST API 호출 + 429 에러 시 자동 재시도 (지수 백오프)"""
    contents = build_gemini_contents(history, message)
    # ★ 동적 시스템 프롬프트 사용 (사주 정보 포함)
    prompt_text = system_prompt if system_prompt else SAJU_SYSTEM_PROMPT
    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": prompt_text}]},
        "generationConfig": GENERATION_CONFIG
    }

    if stream:
        endpoint = f"{GEMINI_API_URL}:streamGenerateContent?alt=sse&key={GEMINI_API_KEY}"
    else:
        endpoint = f"{GEMINI_API_URL}:generateContent?key={GEMINI_API_KEY}"

    for attempt in range(max_retries):
        try:
            resp = http_requests.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                stream=stream,
                timeout=120
            )
            if resp.status_code == 429:
                wait_time = (2 ** attempt) * 2
                print(f"[재시도 {attempt+1}/{max_retries}] Rate limit 초과, {wait_time}초 대기...")
                time.sleep(wait_time)
                if attempt == max_retries - 1:
                    raise Exception("429 RESOURCE_EXHAUSTED")
                continue
            resp.raise_for_status()
            return resp
        except http_requests.exceptions.HTTPError:
            raise
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep((2 ** attempt) * 2)

@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('sessionId', 'default')
    saju_info = data.get('sajuInfo', None)
    language = data.get('language', 'ko')

    # 언어별 응답 지시 (한국어 외 언어 선택 시)
    LANG_INSTRUCTIONS = {
        'ko': '',
        'en': '\n\n[IMPORTANT: Respond entirely in English. Translate all fortune-telling terms into English while keeping the analysis authentic.]',
        'ja': '\n\n[IMPORTANT: すべて日本語で応答してください。四柱推命の用語は日本語で表現してください。]',
        'zh': '\n\n[IMPORTANT: 请全部用中文回答。请用中文表达四柱推命的术语。]'
    }
    lang_instruction = LANG_INSTRUCTIONS.get(language, '')

    # [Gemini API 비용 절감 및 세팅 전략]
    # 1. 계산 분산: 프론트엔드 JS에서 만세력 8글자를 계산해 넘기면 Gemini 연산 토큰 절약
    # 2. 모델 최적화: gemini-2.0-flash 모델 적용으로 기존 대비 5배 이상 저렴하고 빠름
    # 3. 프롬프트 압축: system_instruction으로 정체성("사주 명리학자")과 길이 제한(2~3문장 이내) 강제 설정
    # 4. 캐싱(추후 검토): 1990년생 등 자주 묻는 데이터의 응답 캐싱

    try:
        # 만료 세션 정리
        cleanup_sessions()

        # ★ 세션별 히스토리 관리 + saju_info 별도 저장
        if session_id not in chat_sessions:
            chat_sessions[session_id] = {
                'history': [],
                'last_active': time.time(),
                'saju_info': None
            }
        
        session = chat_sessions[session_id]
        session['last_active'] = time.time()
        history = session['history']
        
        # ★ 첫 요청 시 사주 정보를 세션에 별도 저장 (히스토리와 분리)
        if saju_info:
            session['saju_info'] = saju_info
        
        # ★ 세션에 저장된 사주 정보로 동적 시스템 프롬프트 생성
        current_saju = session.get('saju_info')
        dynamic_prompt = generate_dynamic_system_prompt(current_saju, lang_instruction)
        
        # ★ 히스토리 슬라이딩 윈도우 (최근 20턴 = 40메시지만 유지)
        if len(history) > 40:
            session['history'] = history[-40:]
            history = session['history']
        
        # ★ 히스토리에는 순수 질문만 저장 (사주 데이터 포함하지 않음)
        if saju_info:
            # 첫 메시지: 사주 정보는 시스템 프롬프트에 이미 들어가므로 질문만 전송
            first_question = f"상담자의 첫 질문: {user_message}"
            resp = call_gemini_rest(history, first_question, system_prompt=dynamic_prompt, stream=False)
            final_message = first_question
        else:
            resp = call_gemini_rest(history, user_message, system_prompt=dynamic_prompt, stream=False)
            final_message = user_message
        
        result = resp.json()
        bot_reply = result['candidates'][0]['content']['parts'][0]['text']
        
        # 히스토리에 추가
        history.append({"role": "user", "parts": [{"text": final_message}]})
        history.append({"role": "model", "parts": [{"text": bot_reply}]})
        
        return jsonify({"reply": bot_reply})
    
    except Exception as e:
        print(f"Gemini API 오류: {e}")
        error_str = str(e)
        if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
            return jsonify({"reply": "현재 많은 분이 상담 중이십니다. 잠시 후 다시 말씀해 주시겠습니까?"}), 503
        return jsonify({"reply": "잠시 기운이 흐트러졌습니다. 잠시 후 다시 말씀해 주시겠습니까?"}), 500

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """스트리밍 API — SSE로 실시간 응답 전송"""
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('sessionId', 'default')
    saju_info = data.get('sajuInfo', None)
    language = data.get('language', 'ko')

    LANG_INSTRUCTIONS = {
        'ko': '',
        'en': '\n\n[IMPORTANT: Respond entirely in English.]',
        'ja': '\n\n[IMPORTANT: すべて日本語で応答してください。]',
        'zh': '\n\n[IMPORTANT: 请全部用中文回答。]'
    }
    lang_instruction = LANG_INSTRUCTIONS.get(language, '')

    def generate():
        try:
            cleanup_sessions()

            # ★ 세션 생성 + saju_info 별도 저장
            if session_id not in chat_sessions:
                chat_sessions[session_id] = {
                    'history': [],
                    'last_active': time.time(),
                    'saju_info': None
                }

            session = chat_sessions[session_id]
            session['last_active'] = time.time()
            history = session['history']

            # ★ 첫 요청 시 사주 정보를 세션에 별도 저장
            if saju_info:
                session['saju_info'] = saju_info

            # ★ 세션에 저장된 사주 정보로 동적 시스템 프롬프트 생성
            current_saju = session.get('saju_info')
            dynamic_prompt = generate_dynamic_system_prompt(current_saju, lang_instruction)

            # ★ 히스토리 슬라이딩 윈도우 (최근 20턴 = 40메시지만 유지)
            if len(history) > 40:
                session['history'] = history[-40:]
                history = session['history']

            # ★ 히스토리에는 순수 질문만 저장
            if saju_info:
                message = f"상담자의 첫 질문: {user_message}"
            else:
                message = user_message

            # REST API 스트리밍 응답
            resp = call_gemini_rest(history, message, system_prompt=dynamic_prompt, stream=True)
            full_reply = ""

            for line in resp.iter_lines():
                if not line:
                    continue
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    json_str = line_str[6:]
                    try:
                        chunk_data = json.loads(json_str)
                        text = chunk_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                        if text:
                            full_reply += text
                            # SSE에서 \n은 라인 구분자이므로, 텍스트 내의 줄바꿈을 <br>로 변환하여 보존
                            safe_text = text.replace('\n', '<br>')
                            yield f"data: {safe_text}\n\n"
                    except (json.JSONDecodeError, IndexError, KeyError):
                        continue

            # 스트리밍 완료 후 히스토리에 추가
            history.append({"role": "user", "parts": [{"text": message}]})
            history.append({"role": "model", "parts": [{"text": full_reply}]})
            yield "data: [DONE]\n\n"

        except Exception as e:
            print(f"스트리밍 오류: {e}")
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                yield f"data: 현재 많은 분이 상담 중이십니다. 잠시 후 다시 말씀해 주시겠습니까?\n\n"
            else:
                yield f"data: 잠시 기운이 흐트러졌습니다. 잠시 후 다시 말씀해 주시겠습니까?\n\n"
            yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

if __name__ == '__main__':
    # 테스트 구동 허용
    app.run(host='0.0.0.0', port=5000, debug=True)
