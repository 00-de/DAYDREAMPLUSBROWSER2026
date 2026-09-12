@echo off
title DayDream Browser - トークンの登録
cd /d "%~dp0"

echo ============================================================
echo  GitHub トークンの登録
echo ============================================================
echo.
echo  この登録は、最初に一度だけ行えば大丈夫です。
echo.
echo  トークンは、この PC の中だけに保存されます。
echo  他の人に渡ることはありません。
echo.

if not "%GH_TOKEN%"=="" (
    echo  すでに登録されています。
    echo.
    choice /c YN /n /m "登録し直しますか。 [Y=はい / N=やめる] "
    if errorlevel 2 (
        echo.
        echo  そのままにしました。
        echo.
        pause
        exit /b 0
    )
    echo.
)

echo  ■ トークンの取り方
echo    1. ブラウザで GitHub を開きます（これから自動で開きます）
echo    2. Note の欄に「DayDream Browser」と入力
echo    3. Expiration は「No expiration」を選ぶ
echo    4. Select scopes の「repo」にチェックを入れる
echo    5. 一番下の「Generate token」を押す
echo    6. 表示された ghp_ で始まる文字列をコピー
echo.
echo  ※ この文字列は一度しか表示されません。
echo.

choice /c YN /n /m "ブラウザを開きますか。 [Y=はい / N=いいえ] "
if errorlevel 2 goto INPUT

start "" "https://github.com/settings/tokens/new"
echo.
echo  ブラウザを開きました。
echo.

:INPUT
echo ------------------------------------------------------------
set /p TOKEN="コピーしたトークンを貼り付けて Enter： "

if "%TOKEN%"=="" (
    echo.
    echo [エラー] 何も入力されませんでした。
    echo.
    pause
    exit /b 1
)

echo %TOKEN% | findstr /b "ghp_ github_pat_" > nul
if errorlevel 1 (
    echo.
    echo [注意] ghp_ または github_pat_ で始まっていません。
    echo        貼り付けを間違えていないかご確認ください。
    echo.
    choice /c YN /n /m "このまま登録しますか。 [Y=はい / N=やめる] "
    if errorlevel 2 (
        echo.
        echo  やめました。
        echo.
        pause
        exit /b 0
    )
)

setx GH_TOKEN "%TOKEN%" > nul
if errorlevel 1 (
    echo.
    echo [エラー] 登録に失敗しました。
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  登録しました。
echo.
echo  この画面を一度閉じてから、
echo  「7_公開.bat」をお使いください。
echo.
echo  ※ 閉じずに使うと、登録が反映されません。
echo ============================================================
echo.
pause
