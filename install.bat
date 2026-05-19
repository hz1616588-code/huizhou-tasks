@echo off
title Huizhou Tasks - Install
cls

echo ==========================================
echo   Huizhou Tasks System - Install
echo ==========================================
echo.
echo Select your role / Xuan ze shen fen:
echo.
echo   [1] CS / Ke fu  (Zhongli or Longtan)
echo   [2] Warehouse / Cang guan  (Longtan)
echo   [3] Admin / Guan li yuan  (Xiao Lan)
echo.

set /p choice="Enter 1/2/3 and press Enter: "

set "URL="
set "ROLE="
if "%choice%"=="1" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/cs.html"
  set "ROLE=CS"
)
if "%choice%"=="2" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/warehouse.html"
  set "ROLE=Warehouse"
)
if "%choice%"=="3" (
  set "URL=https://hz1616588-code.github.io/huizhou-tasks/admin.html"
  set "ROLE=Admin"
)

if not defined URL (
  echo.
  echo [ERROR] Invalid input. Run again and enter 1, 2, or 3.
  pause
  exit /b 1
)

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
  echo [ERROR] Chrome or Edge not found.
  echo Install Chrome from https://www.google.com/chrome
  pause
  exit /b 1
)

set "SHORTCUT_NAME=HuizhouTasks"
set "DESKTOP=%USERPROFILE%\Desktop"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo [Browser] %BROWSER%
echo [Role]    %ROLE%
echo [URL]     %URL%
echo.

echo Creating desktop shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $sc.TargetPath = '%BROWSER%'; $sc.Arguments = '--app=%URL%'; $sc.WorkingDirectory = '%USERPROFILE%'; $sc.WindowStyle = 1; $sc.IconLocation = '%BROWSER%,0'; $sc.Description = 'Huizhou Tasks - %ROLE%'; $sc.Save()"

if not exist "%DESKTOP%\%SHORTCUT_NAME%.lnk" (
  echo [ERROR] Failed to create shortcut.
  pause
  exit /b 1
)

echo Adding to Windows Startup...
copy /Y "%DESKTOP%\%SHORTCUT_NAME%.lnk" "%STARTUP%\%SHORTCUT_NAME%.lnk" >nul

echo.
echo ==========================================
echo   Installation Complete!
echo ==========================================
echo.
echo Created shortcuts:
echo   Desktop:  %DESKTOP%\%SHORTCUT_NAME%.lnk
echo   Autorun:  %STARTUP%\%SHORTCUT_NAME%.lnk
echo.
echo Next steps:
echo   1. Double-click "HuizhouTasks" on desktop
echo   2. Select your name from the dropdown
echo   3. Click "Allow" when asked about notifications
echo   4. System will auto-start next time you boot the PC
echo.
echo Tip: You can rename the desktop icon to Chinese
echo      by right-clicking it and choosing Rename.
echo.
echo To uninstall: delete the two shortcut files above.
echo.
pause
