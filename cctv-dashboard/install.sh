#!/bin/bash
# install.sh - CCTV 안전 현황판 전체 설치 자동화 스크립트
# 실행: sudo bash install.sh

set -e

echo "============================================"
echo " 강원개발공사 CCTV 안전 현황판 설치 스크립트"
echo "============================================"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 루트 권한 확인
if [ "$EUID" -ne 0 ]; then
    log_error "루트 권한으로 실행해주세요: sudo bash install.sh"
    exit 1
fi

INSTALL_DIR="/var/www/cctv-dashboard"
GO2RTC_VERSION="1.9.4"

# --------------------------------------------------
# 1. 시스템 패키지 업데이트
# --------------------------------------------------
log_info "시스템 패키지 업데이트 중..."
apt-get update -y
apt-get upgrade -y

# --------------------------------------------------
# 2. Node.js 20 LTS 설치
# --------------------------------------------------
log_info "Node.js 20 LTS 설치 중..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    log_warn "Node.js가 이미 설치되어 있습니다: $(node -v)"
fi

# --------------------------------------------------
# 3. go2rtc 설치
# --------------------------------------------------
log_info "go2rtc ${GO2RTC_VERSION} 설치 중..."
if [ ! -f /usr/local/bin/go2rtc ]; then
    wget -q "https://github.com/AlexxIT/go2rtc/releases/download/v${GO2RTC_VERSION}/go2rtc_linux_amd64" \
        -O /usr/local/bin/go2rtc
    chmod +x /usr/local/bin/go2rtc
    log_info "go2rtc 설치 완료"
else
    log_warn "go2rtc가 이미 설치되어 있습니다"
fi

# go2rtc 전용 사용자 생성
if ! id -u go2rtc &>/dev/null; then
    useradd -r -s /bin/false go2rtc
fi

# go2rtc 설정 파일 복사
mkdir -p /etc/go2rtc
cp go2rtc/go2rtc.yaml /etc/go2rtc/go2rtc.yaml
chown -R go2rtc:go2rtc /etc/go2rtc

# go2rtc systemd 서비스 등록
cp go2rtc/go2rtc.service /etc/systemd/system/go2rtc.service
systemctl daemon-reload
systemctl enable go2rtc
systemctl start go2rtc
log_info "go2rtc 서비스 시작 완료"

# --------------------------------------------------
# 4. 프로젝트 파일 배포
# --------------------------------------------------
log_info "프로젝트 파일 배포 중..."
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"

# --------------------------------------------------
# 5. 백엔드 의존성 설치
# --------------------------------------------------
log_info "백엔드 npm 패키지 설치 중..."
cd "$INSTALL_DIR/server"
npm install --production

# --------------------------------------------------
# 6. 프론트엔드 빌드
# --------------------------------------------------
log_info "프론트엔드 빌드 중..."
cd "$INSTALL_DIR/client"
npm install
npm run build
log_info "프론트엔드 빌드 완료"

# --------------------------------------------------
# 7. Nginx 설치 및 설정
# --------------------------------------------------
log_info "Nginx 설치 및 설정 중..."
apt-get install -y nginx

# 기존 기본 설정 비활성화
rm -f /etc/nginx/sites-enabled/default

# 새 설정 파일 복사
cp "$INSTALL_DIR/nginx/nginx.conf" /etc/nginx/sites-available/cctv-dashboard
ln -sf /etc/nginx/sites-available/cctv-dashboard /etc/nginx/sites-enabled/cctv-dashboard

# Nginx 설정 검증 및 재시작
nginx -t
systemctl enable nginx
systemctl restart nginx
log_info "Nginx 설정 완료"

# --------------------------------------------------
# 8. 백엔드 서버 systemd 서비스 등록
# --------------------------------------------------
log_info "백엔드 서버 서비스 등록 중..."
cat > /etc/systemd/system/cctv-backend.service << 'EOF'
[Unit]
Description=CCTV 안전 현황판 백엔드 서버
After=network.target go2rtc.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cctv-dashboard/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cctv-backend
systemctl start cctv-backend
log_info "백엔드 서버 시작 완료"

# --------------------------------------------------
# 9. 방화벽 설정 (내부망)
# --------------------------------------------------
log_info "방화벽 설정 중..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp    # HTTP (Nginx)
    ufw allow 1984/tcp  # go2rtc API
    ufw allow 8555/udp  # WebRTC
    log_info "방화벽 포트 허용 완료 (80, 1984, 8555)"
fi

# --------------------------------------------------
# 10. 디렉토리 권한 설정
# --------------------------------------------------
chown -R www-data:www-data "$INSTALL_DIR"

echo ""
echo "============================================"
echo -e "${GREEN} 설치 완료!${NC}"
echo "============================================"
echo ""
echo " 웹 접속 주소: http://$(hostname -I | awk '{print $1}')"
echo " 기본 계정:    admin / admin123"
echo ""
echo " 서비스 관리:"
echo "   sudo systemctl status go2rtc"
echo "   sudo systemctl status cctv-backend"
echo "   sudo systemctl status nginx"
echo ""
echo " 로그 확인:"
echo "   sudo journalctl -u go2rtc -f"
echo "   sudo journalctl -u cctv-backend -f"
echo "============================================"
