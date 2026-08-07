@echo off
title DayDream Browser Ultimate - インストーラー作成
cd /d "%~dp0"

echo ============================================================
echo  DayDream Browser Ultimate  インストーラー作成
echo ============================================================
echo.

if not exist "node_modules" (
    echo [エラー] 先に「1_セットアップ.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

if not exist "build\icon.ico" (
    echo [エラー] アイコンが見つかりません。
    echo.
    echo  build フォルダを作り、その中に icon.ico を入れてください。
    echo.
    pause
    exit /b 1
)

echo  これから行うこと
echo    1. コードの検査
echo    2. 本番用のビルド
echo    3. インストーラーの作成
echo.
echo  10 分ほどかかる場合があります。
echo  初回は Electron 本体（約 110MB）をダウンロードします。
echo.

echo [1/3] コードを検査しています...
call npm run lint
if errorlevel 1 goto FAILED

echo.
echo [2/3] 本番用にビルドしています...
call npm run build
if errorlevel 1 goto FAILED

echo.
echo [3/3] インストーラーを作成しています...
call npx electron-builder --win --x64
if errorlevel 1 goto FAILED

echo.
echo ============================================================
echo  完成しました。
echo.
echo  release フォルダの中の
echo    DayDreamBrowser-Setup-1.0.0.exe
echo  が配布用のインストーラーです。
echo ============================================================
echo.
explorer "%~dp0release"
pause
exit /b 0

:FAILED
echo.
echo ============================================================
echo  作成に失敗しました。
echo  上に表示された内容をご確認ください。
echo ============================================================
echo.
pause
exit /b 1
