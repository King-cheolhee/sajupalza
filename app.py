from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# 프론트엔드(Cloudflare Pages 등) 모든 도메인에서 접속 가능하도록 설정
CORS(app) 

@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    data = request.json
    user_message = data.get('message', '')

    # [Gemini API 비용 절감 및 세팅 전략]
    # 1. 계산 분산: 프론트엔드 JS에서 만세력 8글자를 계산해 넘기면 Gemini 연산 토큰 절약
    # 2. 모델 최적화: gemini-2.5-flash 모델 적용으로 기존 대비 5배 이상 저렴하고 빠름
    # 3. 프롬프트 압축: system_instruction으로 정체성("사주 명리학자")과 길이 제한(2~3문장 이내) 강제 설정
    # 4. 캐싱(추후 검토): 1990년생 등 자주 묻는 데이터의 응답 캐싱
    
    # 임시 모의(Mock) 응답
    if "년" in user_message or "월" in user_message:
        bot_reply = f"말씀해주신 정보를 바탕으로 오행과 사주팔자를 뽑아보았습니다. 위 사주 명식을 보면 나무(木)와 불(火)의 기운이 강하게 돋보이네요. 올해 취업운이나 연애운 등 무엇이 가장 궁금하신가요?"
    else:
        bot_reply = "그렇군요. 사주에 비추어 보았을 때 올해는 꾸준히 준비의 결실을 보는 시기로 보입니다. 더 구체적인 운세나 궁금한 점이 있으시면 편하게 물어보세요."

    return jsonify({"reply": bot_reply})

if __name__ == '__main__':
    # 테스트 구동 허용
    app.run(host='0.0.0.0', port=5000, debug=True)
