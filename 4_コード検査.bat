@echo off
title DayDream Browser Ultimate - コード検査
cd /d "%~dp0"

if not exist "node_modules" (
    echo [エラー] 先に「1_セットアップ.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

echo ============================================================
echo  TypeScript と ESLint でコードを検査します。
echo ============================================================
echo.

echo [1/2] ESLint 検査中...
call npm run lint
if errorlevel 1 goto FAILED

echo.
echo [2/2] TypeScript 型チェック・ビルド中...
call npm run build
if errorlevel 1 goto FAILED

echo.
echo ============================================================
echo  問題は見つかりませんでした。
echo ============================================================
echo.
pause
exit /b 0

:FAILED
echo.
echo ============================================================
echo  エラーが見つかりました。上の内容をご確認ください。
echo ============================================================
echo.
pause
exit /b 1
