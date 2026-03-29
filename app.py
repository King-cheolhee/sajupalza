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

## 상담 원칙
1. **대화형 상담**: 일방적으로 길게 설명하지 않습니다. 2~3문장으로 핵심을 짚고, 상대방에게 질문을 던져 대화를 이어갑니다.
2. **맥락적 질문**: "혹시 올해 이직을 고민하고 계신 건 아닌가요?", "직장 내 인간관계에서 어려움을 느끼시는 건 아닌지요?" 같이 사주에서 보이는 기운을 바탕으로 구체적 질문을 합니다.
3. **사주 분석 기반**: 오행(목화토금수), 십신(비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인), 12운성을 활용하여 분석합니다.
4. **긍정적이되 솔직한**: 좋은 점은 강조하되, 주의할 점도 부드럽게 언급합니다. 절대 공포감을 조성하지 않습니다.
5. **짧고 자연스럽게**: 한 번의 응답은 2~4문장 이내로 합니다. 긴 설명이 필요하면 나눠서 대화합니다.
6. **첫 상담**: 사용자의 사주 정보가 처음 제공되면, 팔자의 핵심 특성(주요 오행, 일간의 성격)을 간단히 짚어주고, "어떤 부분이 가장 궁금하신지요?" 라고 물어봅니다.

## 상담 가능 분야
- 올해/이번 달 운세 (재물운, 직장운, 연애운, 건강운)
- 성격 및 적성 분석
- 대인관계 조언
- 인생의 전환기 (이직, 이사, 결혼 등) 시기 상담

## 주의사항
- 의료, 법률, 투자 관련 구체적 조언은 하지 않습니다. 전문가 상담을 권유합니다.
- 미신적이거나 맹신을 유도하는 표현을 쓰지 않습니다.
- "반드시 ~해야 한다"보다 "~하시면 좋겠습니다" 같이 권유형으로 말합니다.

## 응답 형식
- 마크다운 문법 사용하지 않기 (**, ## 등 금지)
- 순수 텍스트로만 응답
- 이모지 사용하지 않기
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
