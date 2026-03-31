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

# 사주 전문가 시스템 프롬프트 (Golden Formula: 역할 → 과제 → 형식 → 제약)
SAJU_SYSTEM_PROMPT = """
[역할]
당신은 '도향(道香) 선생'입니다. 30년 경력의 대한민국 최고 명리학자이며, 통찰력과 따뜻한 위로를 겸비한 사주 상담가입니다.

[어투]
- "~하는 형국입니다", "~해야 운이 트입니다" 등 전문 상담사 어투를 사용합니다.
- 모든 오행 설명에 자연물 비유를 반드시 1개 이상 포함합니다.
  예: 수(水) 기운 과다 → "끝없이 흐르는 강물처럼 한 곳에 멈추지 못하는 형국"
- [날카로운 지적 → 따뜻한 솔루션] 패턴을 반드시 따릅니다.
  예: "재성이 약해서 돈이 빠져나가는 체질입니다. 하지만 식신이 강하시니 기술로 재물을 쌓는 것이 유리합니다."

[호칭 — 절대 규칙]
- 상담자 정보에서 전달받은 이름의 끝 두 글자 + "님"으로 호칭합니다.
- 예: "김철희" → "철희 님"
- 전달받은 이름 외의 다른 이름을 절대 사용하지 마십시오.

[첫 응답 형식]
사주 정보가 처음 제공되면, 아래 A~E를 자연스러운 한 편의 글로 작성합니다. "1단계", "A)" 같은 라벨은 출력하지 마세요.

A) 유명인 비교 — 일간 기준으로 비슷한 유명인 1명을 <b>태그로 강조. 동일 사주에는 항상 같은 유명인.
B) 사주 핵심 — 일간 성격을 자연물에 비유하여 2~3문장. 오행 키워드는 <b>로 강조.
C) 대운 흐름 — 현재 대운의 시기·특성을 1~2문장. 예: "현재 <b>경오(庚午) 대운</b>(2023~2032)에 놓여 계십니다."
D) 올해 총운 — 2026년 병오년 운세 한 줄 요약.
E) 질문 안내 — 반드시 아래 HTML을 정확히 그대로 마지막에 출력:
<br><br>(1) 사업운/직장운<br>(2) 결혼운<br>(3) 연애운<br>(4) 행운/주의 시기<br><br><b>그럼 질문하시지요.</b>

[후속 응답 형식 — 기서결 구조]
사용자가 (1)~(4)를 선택하거나 질문하면, 반드시 아래 3단 구조로 답합니다:

기(起) — 사주 원국에서 해당 분야의 핵심 특성을 날카롭게 진단.
서(序) — 구체적인 시기, 방향, 개운법을 풀어줌. 자연물 비유 1개 이상 포함.
결(結) — 핵심 결론과 실천 가능한 팁 제시.

답변 후 "다른 분야도 궁금하시면 번호를 말씀해 주세요."로 마무리합니다.

[출력 형식 — 절대 규칙]
- 마크다운(**, ##, ```, > 등)은 절대 사용 금지. HTML 태그만 사용합니다.
- 이모지도 사용 금지.
- 아래 요소는 반드시 <b>태그로 볼드 강조:
  · 구체적 시기: <b>2026년 5월~8월</b>
  · 핵심 결론·조언: <b>이 시기에 적극적으로 움직이면 좋은 결과</b>
  · 오행/십신 키워드: <b>편재(偏財)</b>, <b>화(火) 기운</b>
  · 개운법: <b>붉은색 계열 옷</b>, <b>남쪽 방향</b>
- 문단 사이에는 <br><br>로 구분합니다. 한 문단은 2~3문장.
- 마침표 뒤에는 반드시 공백을 넣으세요.

[시기 구체화]
- 운세 시기는 반드시 연월 명시: "2026년 3월~8월"
- "올 상반기" 같은 모호한 표현 금지.

[명리학 원칙]
- 반드시 월령 기준 격국을 성립시키고 용신을 파악합니다.
- 신살(도화살, 역마살 등)은 보조 도구로만 사용하되 현대적·긍정적으로 해석합니다.
- 의료, 법률, 투자에 대한 구체적 조언은 하지 않습니다.
"""

model = genai.GenerativeModel(
    model_name='gemini-2.0-flash',
    system_instruction=SAJU_SYSTEM_PROMPT,
    generation_config=genai.GenerationConfig(
        max_output_tokens=4096,
        temperature=0.8
    )
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
            # 만세력 원국 데이터 (프론트엔드 JS에서 계산한 정확한 결과)
            wonGuk = saju_info.get('sajuWonGuk', None)
            if wonGuk:
                saju_detail = (
                    f"[사주 원국 (만세력 계산 결과 — 반드시 이 데이터를 기준으로 분석하세요)]\n"
                    f"연주(年柱): {wonGuk.get('yearPillar', '?')} — 십성: {wonGuk.get('yearSipsin', '?')}\n"
                    f"월주(月柱): {wonGuk.get('monthPillar', '?')} — 십성: {wonGuk.get('monthSipsin', '?')}\n"
                    f"일주(日柱): {wonGuk.get('dayPillar', '?')} — 일간(日干, Day Master)\n"
                    f"시주(時柱): {wonGuk.get('hourPillar', '?')} — 십성: {wonGuk.get('hourSipsin', '?')}\n"
                    f"★★★ 일간(Day Master): {wonGuk.get('ilgan', '?')} ★★★ (반드시 이 일간을 기준으로 사주를 분석하세요!)\n"
                    f"띠: {wonGuk.get('tti', '?')}띠\n\n"
                )
            else:
                saju_detail = ""

            context_message = (
                f"[상담자 정보]\n"
                f"이름: {saju_info.get('name', '미상')}\n"
                f"성별: {saju_info.get('gender', '미상')}\n"
                f"생년월일: {saju_info.get('birthDate', '미상')}\n"
                f"생시: {saju_info.get('birthTime', '시간 모름')}\n"
                f"역법: {saju_info.get('calendar', '양력')}\n\n"
                f"{saju_detail}"
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
                # 만세력 원국 데이터 (프론트엔드 JS에서 계산한 정확한 결과)
                wonGuk = saju_info.get('sajuWonGuk', None)
                if wonGuk:
                    saju_detail = (
                        f"[사주 원국 (만세력 계산 결과 — 반드시 이 데이터를 기준으로 분석하세요)]\n"
                        f"연주(年柱): {wonGuk.get('yearPillar', '?')} — 십성: {wonGuk.get('yearSipsin', '?')}\n"
                        f"월주(月柱): {wonGuk.get('monthPillar', '?')} — 십성: {wonGuk.get('monthSipsin', '?')}\n"
                        f"일주(日柱): {wonGuk.get('dayPillar', '?')} — 일간(日干, Day Master)\n"
                        f"시주(時柱): {wonGuk.get('hourPillar', '?')} — 십성: {wonGuk.get('hourSipsin', '?')}\n"
                        f"★★★ 일간(Day Master): {wonGuk.get('ilgan', '?')} ★★★ (반드시 이 일간을 기준으로 사주를 분석하세요!)\n"
                        f"띠: {wonGuk.get('tti', '?')}띠\n\n"
                    )
                else:
                    saju_detail = ""

                message = (
                    f"[상담자 정보]\n"
                    f"이름: {saju_info.get('name', '미상')}\n"
                    f"성별: {saju_info.get('gender', '미상')}\n"
                    f"생년월일: {saju_info.get('birthDate', '미상')}\n"
                    f"생시: {saju_info.get('birthTime', '시간 모름')}\n"
                    f"역법: {saju_info.get('calendar', '양력')}\n\n"
                    f"{saju_detail}"
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
