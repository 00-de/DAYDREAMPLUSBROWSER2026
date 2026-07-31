@echo off
title DayDream Browser Ultimate - 開発モード
cd /d "%~dp0"

if not exist "src\App.tsx" (
    echo [エラー] 先に「0_フォルダ整理.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [エラー] セットアップがまだ済んでいません。
    echo  先に「1_セットアップ.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

echo ============================================================
echo  開発モードで起動します。
echo.
echo  ・アプリのウィンドウが自動で開きます
echo  ・コードを保存すると画面が自動で更新されます
echo  ・終了するときは、この黒い画面を閉じてください
echo ============================================================
echo.

call npm run dev

pause
