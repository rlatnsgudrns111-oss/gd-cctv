# 강원개발공사 토목사업부 - CCTV 안전 현황판

RTSP 기반 CCTV 20대를 내부망 웹 브라우저에서 실시간 모니터링하는 안전 현황판 웹 시스템.

## 시스템 구성

| 구성요소 | 기술 | 역할 |
|---------|------|------|
| 스트리밍 서버 | go2rtc | RTSP → WebRTC/HLS 변환 (relay 방식) |
| 웹 서버 | Nginx | 정적 파일 서빙 + 리버스 프록시 |
| 백엔드 | Node.js + Express | 카메라 관리 API, JWT 인증 |
| 프론트엔드 | React + Tailwind CSS | 다크 테마 현황판 UI |
| 데이터베이스 | SQLite (better-sqlite3) | 카메라/사용자 데이터 |

## 빠른 시작

### 자동 설치 (Ubuntu 22.04)

```bash
git clone <repo-url> && cd cctv-dashboard
sudo bash install.sh
```

### 수동 설치

#### 1. go2rtc 설치

```bash
wget https://github.com/AlexxIT/go2rtc/releases/download/v1.9.4/go2rtc_linux_amd64 -O /usr/local/bin/go2rtc
chmod +x /usr/local/bin/go2rtc

# 설정 파일 배치
sudo mkdir -p /etc/go2rtc
sudo cp go2rtc/go2rtc.yaml /etc/go2rtc/

# 서비스 등록
sudo cp go2rtc/go2rtc.service /etc/systemd/system/
sudo systemctl enable --now go2rtc
```

#### 2. 백엔드 서버

```bash
cd server
cp .env.example .env  # 환경변수 수정
npm install
npm start
```

#### 3. 프론트엔드 빌드

```bash
cd client
npm install
npm run build
```

#### 4. Nginx 설정

```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/cctv-dashboard
sudo ln -s /etc/nginx/sites-available/cctv-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Docker 방식 (선택)

```bash
cd client && npm install && npm run build && cd ..
docker-compose up -d
```

## 기본 계정

- 아이디: `admin`
- 비밀번호: `admin123`

관리자 계정 변경:

```bash
bash create-admin.sh newadmin newpassword
```

## 카메라 RTSP 설정

`go2rtc/go2rtc.yaml` 파일에서 실제 카메라 RTSP 주소로 변경:

```yaml
streams:
  cam_1:
    - rtsp://계정:비밀번호@카메라IP:554/stream1
```

또는 관리자 페이지(`/admin`)에서 웹 UI로 카메라를 등록/수정/삭제할 수 있습니다.

## 포트 구성

| 포트 | 프로토콜 | 용도 |
|------|---------|------|
| 80 | TCP | Nginx (웹 접속) |
| 1984 | TCP | go2rtc API |
| 3001 | TCP | Express 백엔드 |
| 8555 | UDP | WebRTC |

## 서비스 관리

```bash
# 서비스 상태 확인
sudo systemctl status go2rtc
sudo systemctl status cctv-backend
sudo systemctl status nginx

# 로그 확인
sudo journalctl -u go2rtc -f
sudo journalctl -u cctv-backend -f

# 서비스 재시작
sudo systemctl restart go2rtc
sudo systemctl restart cctv-backend
```

## 디렉토리 구조

```
cctv-dashboard/
├── server/                  # 백엔드
│   ├── index.js             # Express 서버 진입점
│   ├── routes/auth.js       # 인증 API
│   ├── routes/cameras.js    # 카메라 CRUD API
│   ├── middleware/auth.js   # JWT 미들웨어
│   ├── services/go2rtc.js   # go2rtc 연동
│   └── db/database.js       # SQLite 초기화
├── client/                  # 프론트엔드
│   └── src/
│       ├── pages/           # 페이지 컴포넌트
│       ├── components/      # UI 컴포넌트
│       └── hooks/           # 커스텀 훅
├── nginx/nginx.conf         # Nginx 설정
├── go2rtc/go2rtc.yaml       # go2rtc 설정
├── install.sh               # 자동 설치 스크립트
└── docker-compose.yml       # Docker 구성
```
