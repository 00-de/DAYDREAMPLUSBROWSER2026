@echo off
title DayDream Browser - インストーラー作成（管理者）

rem --- 管理者権限がなければ、昇格して実行し直します ---
net session >nul 2>&1
if errorlevel 1 (
    echo 管理者権限で開き直します。
    echo 確認の画面が出たら「はい」を押してください。
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ============================================================
echo  インストーラー作成（管理者として実行中）
echo ============================================================
echo.
echo  シンボリックリンクの作成には管理者権限が必要なため、
echo  この方法で作成します。
echo.

if not exist "node_modules" (
    echo [エラー] 先に「1_セットアップ.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

if not exist "build\icon.ico" (
    echo [エラー] build フォルダに icon.ico がありません。
    echo.
    pause
    exit /b 1
)

echo  前回の失敗した記録を消しています...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
    echo    消去しました。
)
echo.

echo [1/2] 本番用にビルドしています...
call npm run build
if errorlevel 1 (
    echo.
    echo [失敗] ビルドでエラーが出ました。
    echo.
    pause
    exit /b 1
)
echo.

echo [2/2] インストーラーを作成しています...
echo    5分ほどかかります。そのままお待ちください。
echo.

call npx electron-builder --win --x64

echo.
echo ============================================================

if exist "release\*.exe" (
    echo  完成しました。
    echo.
    echo  release フォルダの中の
    echo    DayDreamBrowser-Setup-1.0.0.exe
    echo    latest.yml
    echo  この2つを GitHub の Releases に上げてください。
    echo ============================================================
    echo.
    explorer "%~dp0release"
) else (
    echo  作成できませんでした。
    echo.
    echo  上に表示された赤い文字の内容をお伝えください。
    echo ============================================================
)

echo.
pause
