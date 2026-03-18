@echo off
cd /d %USERPROFILE%\Desktop\gd-cctv\cctv-dashboard

echo CCTV Starting...

start "go2rtc" /min cmd /k "cd /d %USERPROFILE%\Desktop\gd-cctv\cctv-dashboard\go2rtc && go2rtc.exe"

ping localhost -n 4 >/dev/null

start "server" /min cmd /k "cd /d %USERPROFILE%\Desktop\gd-cctv\cctv-dashboard\server && node index.js"

ping localhost -n 4 >/dev/null

start "client" /min cmd /k "cd /d %USERPROFILE%\Desktop\gd-cctv\cctv-dashboard\client && npm start"

ping localhost -n 31 >/dev/null

start http://localhost:3000

echo CCTV Started!
pause
