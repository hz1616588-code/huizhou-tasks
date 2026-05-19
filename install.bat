@echo off
chcp 65001 >nul
title 匯洲工單系統 - 一鍵安裝
cls

echo ============================================
echo   匯洲工單系統 - 一鍵安裝設定
echo ============================================
echo.
echo 請選擇您的身份：
echo.
echo   [1] 中壢 / 龍潭 客服
echo   [2] 龍潭 倉管
echo   [3] 管理員（小瀾）
echo.
set /p choice="請輸入 1/2/3 後按 Enter："

set "URL="
set "ROLE="
if "%choice%"=="1" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/cs.html"
  set "ROLE=客服"
)
if "%choice%"=="2" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/warehouse.html"
  set "ROLE=倉管"
)
if "%choice%"=="3" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/admin.html"
  set "ROLE=管理員"
)

if not defined URL (
  echo.
  echo [錯誤] 輸入無效，請重新執行此程式
  pause
  exit /b 1
)

REM 尋找 Chrome 或 Edge
set "BROWSER="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
  set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
  set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if not defined BROWSER (
  echo.
  echo [錯誤] 找不到 Chrome 或 Edge 瀏覽器
  echo 請先到 https://www.google.com/chrome 下載安裝 Chrome
  echo 安裝後再執行此程式
  pause
  exit /b 1
)

set "SHORTCUT_NAME=匯洲工單"
set "DESKTOP=%USERPROFILE%\Desktop"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo [偵測] 瀏覽器：%BROWSER%
echo [身份] %ROLE%
echo [網址] %URL%
echo.
echo [建立] 桌面捷徑...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $sc.TargetPath = '%BROWSER%'; $sc.Arguments = '--app=%URL%'; $sc.WorkingDirectory = '%USERPROFILE%'; $sc.WindowStyle = 1; $sc.IconLocation = '%BROWSER%,0'; $sc.Description = '匯洲工單系統 - %ROLE%'; $sc.Save()"

if not exist "%DESKTOP%\%SHORTCUT_NAME%.lnk" (
  echo [錯誤] 捷徑建立失敗，請聯絡 IT 或重試
  pause
  exit /b 1
)

echo [建立] 開機自啟動...
copy /Y "%DESKTOP%\%SHORTCUT_NAME%.lnk" "%STARTUP%\%SHORTCUT_NAME%.lnk" >nul

echo.
echo ============================================
echo   ✓ 安裝完成
echo ============================================
echo.
echo  桌面捷徑：%DESKTOP%\%SHORTCUT_NAME%.lnk
echo  開機自啟：%STARTUP%\%SHORTCUT_NAME%.lnk
echo.
echo  下一步：
echo   1. 雙擊桌面的「%SHORTCUT_NAME%」即可開啟
echo   2. 第一次開啟時，從清單中選擇您的姓名
echo   3. 跳出「允許桌面通知」請點【允許】
echo   4. 下次開機會自動跳出（不必再執行此程式）
echo.
echo  如要解除安裝：刪除桌面與啟動資料夾兩個捷徑即可
echo  啟動資料夾位置：%STARTUP%
echo.
echo ============================================
echo   進階：永遠浮在最上層（倉管推薦）
echo ============================================
echo.
echo  1. 開啟 Microsoft Store
echo  2. 搜尋並安裝「PowerToys」（免費，Microsoft 官方）
echo  3. 啟動 PowerToys → 左側選「Always On Top」並開啟
echo  4. 打開工單視窗，按 Win+Ctrl+T 即可
echo     再按一次可解除
echo.
echo  完成後，無論開啟 Excel、PDF、LINE，
echo  工單視窗都會浮在最上面，新工單來不會錯過
echo.
pause
