# Gunicorn 설정 파일
# 실행: gunicorn -c gunicorn.conf.py app:app

import multiprocessing

# 워커 수: CPU 코어 수 × 2 + 1 (Gemini API는 I/O 대기가 많으므로 넉넉하게)
workers = multiprocessing.cpu_count() * 2 + 1

# gevent 비동기 워커 (I/O 대기 최적화)
worker_class = 'gevent'

# 워커당 동시 처리 가능 수
worker_connections = 200

# 요청 타임아웃 (Gemini API 응답 대기 포함)
timeout = 120

# 바인드 주소
bind = '0.0.0.0:5000'

# 로깅
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# 메모리 누수 방지: 워커당 최대 요청 수 후 재시작
max_requests = 1000
max_requests_jitter = 50
