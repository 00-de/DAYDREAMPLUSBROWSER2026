@echo off
chcp 65001 > nul
title DayDream Browser Ultimate - インストーラー作成
cd /d "%~dp0"

if not exist "node_modules" (
    echo [エラー] 先に「1_セットアップ.bat」を実行してください。
    pause
    exit /b 1
)

echo ============================================================
echo  Windows用インストーラーを作成します。
echo  10 分ほどかかる場合があります。
echo ============================================================
echo.

call npm run dist

if errorlevel 1 (
    echo.
    echo [エラー] 作成に失敗しました。上の赤い文字をご確認ください。
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  完成しました。
echo  release フォルダの中に .exe ファイルがあります。
echo ============================================================
echo.
explorer "%~dp0release"
pause
