@echo off
title DayDream Browser - バージョンを上げる
cd /d "%~dp0"

if not exist "package.json" (
    echo [エラー] package.json が見つかりません。
    echo.
    pause
    exit /b 1
)

for /f "usebackq tokens=*" %%v in (`node -p "require('./package.json').version"`) do set VER=%%v

echo ============================================================
echo  バージョンを上げる
echo ============================================================
echo.
echo  いまのバージョン： %VER%
echo.
echo  どれくらい変わりましたか。
echo.
echo    [1] 小さな修正        （1.0.0 → 1.0.1）
echo    [2] 機能を足した      （1.0.1 → 1.1.0）
echo    [3] 大きく作り直した  （1.1.0 → 2.0.0）
echo    [0] やめる
echo.

choice /c 1230 /n /m "番号を選んでください： "
set SEL=%errorlevel%

if %SEL%==4 (
    echo.
    echo  やめました。
    echo.
    pause
    exit /b 0
)

if %SEL%==1 set KIND=patch
if %SEL%==2 set KIND=minor
if %SEL%==3 set KIND=major

echo.
echo  書き換えています...

node -e "const fs=require('fs');const p='./package.json';const d=JSON.parse(fs.readFileSync(p,'utf8'));const a=d.version.split('.').map(Number);const k='%KIND%';if(k==='patch')a[2]++;if(k==='minor'){a[1]++;a[2]=0;}if(k==='major'){a[0]++;a[1]=0;a[2]=0;}d.version=a.join('.');fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');console.log('  新しいバージョン： '+d.version);"

if errorlevel 1 (
    echo.
    echo [エラー] 書き換えに失敗しました。
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  変更しました。
echo.
echo  次は「7_公開.bat」をダブルクリックしてください。
echo ============================================================
echo.
pause
