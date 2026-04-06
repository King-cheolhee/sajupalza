#!/bin/bash
# ===================================================
# 도향(道香) sajupalza — AWS Lightsail 원클릭 배포 스크립트
# 사용법: bash deploy.sh
# ===================================================

set -e

echo "=============================="
echo " 도향(道香) 서버 배포 시작"
echo "=============================="

# 1. 스왑 파일 설정 (512MB RAM 서버 OOM 방지)
if [ ! -f /swapfile ]; then
    echo "스왑 파일 생성 중 (2GB)..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ 2GB 스왑 파일 생성 완료"
fi

# 2. 시스템 패키지 업데이트 + Python 설치
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git nginx

# 2. 프로젝트 클론 (이미 있으면 pull)
APP_DIR="/home/ubuntu/sajupalza"
if [ -d "$APP_DIR" ]; then
    echo "기존 프로젝트 업데이트 중..."
    cd $APP_DIR && git pull origin main
else
    echo "프로젝트 클론 중..."
    git clone https://github.com/King-cheolhee/sajupalza.git $APP_DIR
    cd $APP_DIR
fi

# 3. 가상환경 생성 + 패키지 설치
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. 환경변수 설정 (.env 파일이 없는 경우)
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다!"
    read -p "GEMINI_API_KEY를 입력하세요: " api_key
    echo "GEMINI_API_KEY=$api_key" > .env
    echo "✅ .env 파일 생성 완료"
fi

# 5. systemd 서비스 등록
sudo tee /etc/systemd/system/sajupalza.service > /dev/null << 'EOF'
[Unit]
Description=Dohyang Sajupalza Flask App
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/sajupalza
ExecStart=/home/ubuntu/sajupalza/venv/bin/gunicorn --preload --workers 2 --threads 2 --bind 127.0.0.1:5000 --timeout 300 app:app
Restart=always
RestartSec=5
EnvironmentFile=/home/ubuntu/sajupalza/.env

[Install]
WantedBy=multi-user.target
EOF

# 6. Nginx 리버스 프록시 설정
sudo tee /etc/nginx/sites-available/sajupalza > /dev/null << 'EOF'
server {
    listen 80;
    server_name saju.run www.saju.run _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 스트리밍 지원
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/sajupalza /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 7. 서비스 시작
sudo systemctl daemon-reload
sudo systemctl enable sajupalza
sudo systemctl restart sajupalza

echo ""
echo "=============================="
echo " ✅ 배포 완료!"
echo " 서버: http://$(curl -s ifconfig.me)"
echo " 상태: sudo systemctl status sajupalza"
echo " 로그: sudo journalctl -u sajupalza -f"
echo "=============================="
