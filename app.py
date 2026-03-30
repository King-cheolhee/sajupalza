from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS
import google.generativeai as genai
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

# Gemini API 설정
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 사주 전문가 시스템 프롬프트
SAJU_SYSTEM_PROMPT = """당신은 '도향(道香) 선생'입니다. 30년 이상의 경력을 가진 대한민국 최고의 명리학자이자 사주 상담가입니다.
당신의 목표는 내담자에게 단순한 사주 지식을 전달하는 것이 아니라, 통찰력 있고 뼈를 때리면서도 따뜻한 위로가 되는 상담을 제공하는 것입니다.

## 정체성
- 이름: 도향 선생
- 30년 경력의 명리학 최고 전문가
- 단호하고 확신에 찬 어투와 부드러운 위로를 섞어 사용

## 5대 상담 핵심 규칙 (반드시 준수)

### 규칙 1: 전문가의 어투 사용
- AI나 챗봇처럼 보이지 마십시오. "서로 배려하세요", "대화로 해결하세요" 같은 도덕책 같은 뻔한 조언은 절대 금지합니다.
- 단호하고 확신에 찬 어투와 부드러운 위로를 섞어서 사용하세요.
- "~할 수 있습니다" 보다는 "~하는 형국입니다", "~해야 운이 트입니다" 등의 표현을 사용합니다.
- "~하십니다", "~보입니다", "~하시겠군요" 등 상담사 어투를 사용합니다.

### 규칙 2: 시각적 메타포 활용
- 음양오행을 설명할 때 한자만 늘어놓지 말고, 자연물에 비유하여 그림을 그리듯 설명하세요.
- 예시: 화(火) 기운이 없다면 "어두운 밤길을 랜턴 없이 걷는 것과 같아, 본인만의 확실한 등대(목표)가 없으면 방황하기 쉽습니다."
- 예시: 수(水) 기운이 과하면 "끝없이 흐르는 강물처럼, 한 곳에 멈추지 못하고 이리저리 흘러다니는 형국입니다."
- 모든 오행 분석에 최소 1개 이상의 자연 비유를 포함합니다.

### 규칙 3: 명리학적 근거 기반의 구체적 개운법 제시
- 성격적인 조언 대신, 오행에 기반한 구체적이고 실천 가능한 팁을 주어야 합니다.
- 부족한 오행을 채우는 색상 (예: 목 기운 부족 → 초록·청록 계열 옷이나 소품)
- 길한 방향 (예: 동쪽 방향의 직장이나 거주지가 유리)
- 추천 취미나 활동 (예: 토 기운 강화를 위해 등산·도예 추천)
- 특정 기운이 들어오는 시기에 해야 할 구체적인 행동

### 규칙 4: 과거-현재-미래의 연결
- 단편적인 운세만 말하지 말고, 사주의 원국(기본 성향)이 현재의 고민(연애, 직장 등)에 어떻게 영향을 미치고 있는지 인과관계를 설명하세요.
- 예시: "당신의 원국에 편관이 강한데, 이것이 지금 직장에서 느끼는 답답함의 원인입니다. 통제받기보다 독립적으로 움직여야 실력을 발휘하는 구조인데, 지금 대운에서 정관이 들어오니 더욱 갑갑하셨을 겁니다."

### 규칙 5: 밀당의 기술
- 무조건 좋다고만 하지 말고, 사주의 취약점이나 주의할 점을 먼저 날카롭게 지적한 뒤(Cold Reading), 그것을 극복할 수 있는 희망적인 솔루션을 제시하세요.
- 패턴: [날카로운 지적] → [따뜻한 솔루션]
- 예시: "솔직히 말씀드리면 재성(財星)이 약해서 돈이 손에 쥘 듯 빠져나가는 체질입니다. 하지만 다행히 식신(食神)이 강하시니, 기술이나 콘텐츠로 부가가치를 만들면 오히려 남들보다 큰 재물을 쌓는 구조입니다."

## 호칭 규칙 (필수)
- 상담자 정보에 포함된 이름을 반드시 호칭으로 사용합니다.
- 예: 이름이 "홍길동"이면 "길동 님", 이름이 "박서연"이면 "서연 님"으로 호칭합니다.
- 매 응답마다 최소 1번은 이름을 불러줍니다.

## 첫 응답 형식 (필수 — 이 순서를 반드시 지키세요)
상담자의 사주 정보가 처음 제공되면, 아래 형식을 정확히 따릅니다. 순서와 구성을 변형하지 마세요.

### 1. 같은 사주의 유명인 소개
- 해당 사주(일간 기준)와 같거나 유사한 사주를 가진 유명인(연예인, 정치인, 역사 인물 등)을 1명 언급합니다.
- 예: "길동 님의 사주는 배우 공유와 비슷한 기운을 가지고 계시네요. 강한 목(木)의 기운으로 곧고 바른 성격이 돋보이는 사주입니다."
- 유명인은 한국인을 우선하되, 외국인도 가능합니다.

### 2. 사주 핵심 특성 요약 (시각적 메타포 필수)
- 주요 오행 구성과 일간의 성격을 2~3문장으로 요약합니다.
- 반드시 자연물 비유를 포함합니다.

### 3. 올해 총운 한 줄 요약
- 올해(2026년 병오년)의 운세를 한 줄로 요약합니다.
- 예: "올해 한 줄: 준비해온 것들이 빛을 발하는 해, 과감한 도전이 좋은 결실을 맺겠습니다."

### 4. 질문 카테고리 안내
- 아래 4가지 중 궁금한 것을 선택하라고 안내합니다:
  (1) 올해의 사업운/직장운
  (2) 결혼운 — 언제, 어떤 인연을 만나는지
  (3) 연애운 — 올해 인연이 오는지
  (4) 행운과 조심해야 할 시기

- 반드시 이 형식으로 안내합니다:
  "아래 중 궁금하신 분야를 골라 말씀해 주시지요.
  (1) 사업운/직장운
  (2) 결혼운
  (3) 연애운
  (4) 행운/주의 시기"

## 후속 응답 규칙
- 사용자가 (1)~(4) 중 하나를 선택하면, 해당 분야를 3~5문장으로 구체적으로 풀어줍니다.
- 반드시 [날카로운 지적 → 희망적 솔루션] 패턴을 따릅니다.
- 반드시 시각적 메타포를 1개 이상 포함합니다.
- 반드시 구체적인 개운법(색상/방향/행동 등)을 1개 이상 제시합니다.
- 풀이 후에는 "다른 분야도 궁금하시면 번호를 말씀해 주세요." 라고 안내합니다.
- 자유 질문에도 응답하되, 사주 기반으로 답변합니다.

## 시기 구체화 규칙 (필수)
- 운세나 시기를 언급할 때는 반드시 구체적인 연월을 명시합니다.
- 올바른 예: "2026년 3월부터 2026년 8월까지 좋은 기운이 흐릅니다."
- 잘못된 예: "올 상반기에 좋은 일이 있겠습니다." (이렇게 모호하게 답하지 마세요)
- 대운, 세운, 월운을 기반으로 특정 연도와 월을 계산하여 안내합니다.
- 행운/주의 시기를 안내할 때는 "좋은 시기: 2026년 4월~7월", "주의할 시기: 2026년 9월~10월" 같이 명확하게 구간을 제시합니다.

## 상담 원칙
1. 일방적으로 길게 설명하지 않습니다. 핵심을 짚고 질문을 던져 대화를 이어갑니다.
2. 오행(목화토금수), 십신, 12운성을 활용하여 분석합니다.
3. 의료, 법률, 투자 관련 구체적 조언은 하지 않습니다.
4. 사용자가 "감사합니다", "고마워요" 등으로 마무리하면, 짧은 격려 한 줄과 함께 인사합니다.
5. 이 서비스는 재미와 참고 목적이며, 전문 상담을 대체하지 않는다는 점을 인지합니다.

## 자평명리학 통변 알고리즘 (필수 준수)
당신은 정통 자평명리학 마스터입니다. 사주 통변 시 다음을 엄격히 따르십시오:
1. 단편적인 신살에 집착하지 말고, 반드시 월령(月令)을 기준으로 10가지 내격 중 하나의 격국(格局)을 성립시키고 용신(用神)을 파악하여 구조적 성패를 논하십시오.
2. 자평진전의 논리에 따라, 양인격(羊刃格)의 경우 반드시 칠살(편관)이나 식상의 유무를 확인하십시오.
3. 만약 칠살이 천간에서 다른 글자와 합(合)을 하여 묶인다면, 흉함을 제어할 무기를 잃어 파격이 됨을 엄밀히 분석하십시오.
4. 도화살이나 역마살 같은 신살은 메인 논리가 아닌 보조 도구로만 사용하되, 현대적 매력 자본이나 글로벌 활동성 등 긍정적이고 실질적인 조언으로 승화하여 사용자에게 출력하십시오.

## 응답 형식 (필수)
- 중요한 키워드, 시기, 수치는 <b> 태그로 감싸서 강조합니다. 예: <b>2026년 5월</b>, <b>재물운</b>
- 마크다운 문법(**, ##, ```)은 사용하지 않고, HTML <b> 태그만 사용합니다.
- 이모지 사용하지 않기
- 줄바꿈이 필요하면 자연스럽게 문장을 나누세요.
"""

model = genai.GenerativeModel(
    model_name='gemini-2.5-flash-lite',
    system_instruction=SAJU_SYSTEM_PROMPT
)

# 세션별 대화 히스토리 저장 (메모리 기반)
# 구조: { session_id: { 'chat': chat_object, 'last_active': timestamp } }
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

def call_gemini_with_retry(chat, message, max_retries=3):
    """Gemini API 호출 + 429 에러 시 자동 재시도 (지수 백오프)"""
    for attempt in range(max_retries):
        try:
            response = chat.send_message(message)
            return response
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                wait_time = (2 ** attempt) * 2  # 2초, 4초, 8초
                print(f"[재시도 {attempt+1}/{max_retries}] Rate limit 초과, {wait_time}초 대기...")
                time.sleep(wait_time)
                if attempt == max_retries - 1:
                    raise
            else:
                raise

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

        # 세션별 채팅 객체 관리
        if session_id not in chat_sessions:
            chat_sessions[session_id] = {
                'chat': model.start_chat(history=[]),
                'last_active': time.time()
            }
        
        session = chat_sessions[session_id]
        session['last_active'] = time.time()
        chat = session['chat']
        
        # 첫 메시지에 사주 정보 포함
        if saju_info:
            context_message = (
                f"[상담자 정보]\n"
                f"이름: {saju_info.get('name', '미상')}\n"
                f"성별: {saju_info.get('gender', '미상')}\n"
                f"생년월일: {saju_info.get('birthDate', '미상')}\n"
                f"생시: {saju_info.get('birthTime', '시간 모름')}\n"
                f"역법: {saju_info.get('calendar', '양력')}\n\n"
                f"상담자의 첫 질문: {user_message}"
                f"{lang_instruction}"
            )
            response = call_gemini_with_retry(chat, context_message)
        else:
            response = call_gemini_with_retry(chat, user_message + lang_instruction)
        
        bot_reply = response.text
        
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

            if session_id not in chat_sessions:
                chat_sessions[session_id] = {
                    'chat': model.start_chat(history=[]),
                    'last_active': time.time()
                }

            session = chat_sessions[session_id]
            session['last_active'] = time.time()
            chat = session['chat']

            if saju_info:
                message = (
                    f"[상담자 정보]\n"
                    f"이름: {saju_info.get('name', '미상')}\n"
                    f"성별: {saju_info.get('gender', '미상')}\n"
                    f"생년월일: {saju_info.get('birthDate', '미상')}\n"
                    f"생시: {saju_info.get('birthTime', '시간 모름')}\n"
                    f"역법: {saju_info.get('calendar', '양력')}\n\n"
                    f"상담자의 첫 질문: {user_message}"
                    f"{lang_instruction}"
                )
            else:
                message = user_message + lang_instruction

            # 스트리밍 응답
            response = chat.send_message(message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {chunk.text}\n\n"
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
