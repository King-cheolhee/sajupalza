from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import os
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
SAJU_SYSTEM_PROMPT = """당신은 '도향(道香) 선생'입니다. 30년 경력의 사주명리 전문가로, 따뜻하면서도 정확한 상담을 합니다.

## 정체성
- 이름: 도향 선생
- 말투: 존댓말, 부드럽지만 핵심을 짚는 상담 스타일
- "~하십니다", "~보입니다", "~하시겠군요" 등 상담사 어투 사용

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

### 2. 사주 핵심 특성 요약
- 주요 오행 구성과 일간의 성격을 2~3문장으로 요약합니다.

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
3. 좋은 점은 강조하되, 주의할 점도 부드럽게 언급합니다. 절대 공포감을 조성하지 않습니다.
4. 의료, 법률, 투자 관련 구체적 조언은 하지 않습니다.
5. "반드시 ~해야 한다"보다 "~하시면 좋겠습니다" 같이 권유형으로 말합니다.
6. 사용자가 "감사합니다", "고마워요" 등으로 마무리하면, 짧은 격려 한 줄과 함께 인사합니다.
7. 이 서비스는 재미와 참고 목적이며, 전문 상담을 대체하지 않는다는 점을 인지합니다.

## 응답 형식 (필수)
- 중요한 키워드, 시기, 수치는 <b> 태그로 감싸서 강조합니다. 예: <b>2026년 5월</b>, <b>재물운</b>
- 마크다운 문법(**, ##, ```)은 사용하지 않고, HTML <b> 태그만 사용합니다.
- 이모지 사용하지 않기
- 줄바꿈이 필요하면 자연스럽게 문장을 나누세요.
"""

model = genai.GenerativeModel(
    model_name='gemini-2.0-flash',
    system_instruction=SAJU_SYSTEM_PROMPT
)

# 세션별 대화 히스토리 저장 (메모리 기반)
chat_sessions = {}

@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('sessionId', 'default')
    saju_info = data.get('sajuInfo', None)

    # [Gemini API 비용 절감 및 세팅 전략]
    # 1. 계산 분산: 프론트엔드 JS에서 만세력 8글자를 계산해 넘기면 Gemini 연산 토큰 절약
    # 2. 모델 최적화: gemini-2.0-flash 모델 적용으로 기존 대비 5배 이상 저렴하고 빠름
    # 3. 프롬프트 압축: system_instruction으로 정체성("사주 명리학자")과 길이 제한(2~3문장 이내) 강제 설정
    # 4. 캐싱(추후 검토): 1990년생 등 자주 묻는 데이터의 응답 캐싱

    try:
        # 세션별 채팅 객체 관리
        if session_id not in chat_sessions:
            chat_sessions[session_id] = model.start_chat(history=[])
        
        chat = chat_sessions[session_id]
        
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
            )
            response = chat.send_message(context_message)
        else:
            response = chat.send_message(user_message)
        
        bot_reply = response.text
        
        return jsonify({"reply": bot_reply})
    
    except Exception as e:
        print(f"Gemini API 오류: {e}")
        return jsonify({"reply": "잠시 기운이 흐트러졌습니다. 잠시 후 다시 말씀해 주시겠습니까?"}), 500

if __name__ == '__main__':
    # 테스트 구동 허용
    app.run(host='0.0.0.0', port=5000, debug=True)
