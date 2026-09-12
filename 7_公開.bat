@echo off
title DayDream Browser - 公開（自動）
cd /d "%~dp0"

echo ============================================================
echo  DayDream Browser Ultimate  公開
echo ============================================================
echo.

rem ---------- 事前の確認 ----------

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

if "%GH_TOKEN%"=="" (
    echo [エラー] GitHub のトークンが登録されていません。
    echo.
    echo  「PUBLISH_SETUP.md」の手順1～2 をご覧のうえ、
    echo  トークンを登録してから、もう一度お試しください。
    echo.
    echo  登録後は、この画面を一度閉じてから開き直してください。
    echo.
    pause
    exit /b 1
)

rem ---------- いまのバージョンを表示 ----------

for /f "usebackq tokens=*" %%v in (`node -p "require('./package.json').version"`) do set VER=%%v

echo  いまのバージョン： %VER%
echo.
echo  このバージョンで公開します。
echo  数字を上げ忘れていると、公開に失敗します。
echo.
echo  よろしければ何かキーを押してください。
echo  やめる場合は、この画面を閉じてください。
pause > nul
echo.

rem ---------- 1. 検査 ----------

echo [1/4] コードを検査しています...
call npm run lint
if errorlevel 1 goto FAILED
echo    問題ありませんでした。
echo.

rem ---------- 2. ビルド ----------

echo [2/4] 本番用にビルドしています...
call npm run build
if errorlevel 1 goto FAILED
echo    完了しました。
echo.

rem ---------- 3. インストーラー作成と公開 ----------

echo [3/4] インストーラーを作り、GitHub へ送ります...
echo    5分ほどかかります。そのままお待ちください。
echo.

call npx electron-builder --win --x64 --publish always
if errorlevel 1 goto FAILED
echo.

rem ---------- 4. 確認 ----------

echo [4/4] 結果を確認しています...

if not exist "release\*.exe" (
    echo.
    echo [失敗] インストーラーが作られませんでした。
    goto FAILED
)

echo.
echo ============================================================
echo  公開しました。
echo.
echo  バージョン： %VER%
echo.
echo  GitHub の Releases に下書きとして置かれています。
echo  最後に、ブラウザで内容を確かめて公開してください。
echo ============================================================
echo.

start "" "https://github.com/00-de/DAYDREAMPLUSBROWSER2026/releases"

echo  ブラウザを開きました。
echo.
echo  ■ ブラウザでの仕上げ
echo    1. 一番上の v%VER% を開く
echo    2. 右上の鉛筆マーク（Edit）を押す
echo    3. 変更内容を書く（利用者の画面に表示されます）
echo    4. 「Set as the latest release」にチェックが入っているか確認
echo    5. 「Publish release」を押す
echo.
echo  これで、友人のアプリに更新のお知らせが届きます。
echo.
pause
exit /b 0

:FAILED
echo.
echo ============================================================
echo  失敗しました。
echo  上に表示された内容をご確認ください。
echo ============================================================
echo.
echo  よくある原因
echo    ・バージョンの数字を上げ忘れている
echo    ・同じバージョンが既に公開されている
echo    ・インターネットにつながっていない
echo    ・トークンの期限が切れている
echo.
pause
exit /b 1
