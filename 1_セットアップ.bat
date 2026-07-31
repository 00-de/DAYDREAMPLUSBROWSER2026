@echo off
chcp 65001 > nul
title DayDream Browser Ultimate - セットアップ
cd /d "%~dp0"

echo ============================================================
echo  DayDream Browser Ultimate  セットアップ
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [エラー] Node.js が見つかりません。
    echo.
    echo  https://nodejs.org/ja から LTS版 をダウンロードし、
    echo  インストールしてから、もう一度このファイルを実行してください。
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do echo  Node.js %%v を確認しました。
echo.
echo  必要な部品をダウンロードします。
echo  初回は 5 分ほどかかります。そのままお待ちください。
echo.

call npm install --no-audit --no-fund

if errorlevel 1 (
    echo.
    echo [エラー] インストールに失敗しました。
    echo  インターネット接続を確認して、もう一度お試しください。
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  セットアップが完了しました。
echo  次は「2_開発起動.bat」をダブルクリックしてください。
echo ============================================================
echo.
pause
