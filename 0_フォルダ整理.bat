@echo off
title DayDream Browser Ultimate - フォルダ整理
cd /d "%~dp0"

echo ============================================================
echo  DayDream Browser Ultimate  フォルダ整理
echo ============================================================
echo.
echo  バラバラになっているファイルを、正しい場所に移動します。
echo.

rem --- フォルダを作る ---
if not exist "electron"        mkdir "electron"
if not exist "src"             mkdir "src"
if not exist "src\components"  mkdir "src\components"
if not exist "src\lib"         mkdir "src\lib"
if not exist "src\types"       mkdir "src\types"

rem --- electron フォルダへ ---
if exist "main.cjs"       move /y "main.cjs"       "electron\" >nul
if exist "preload.cjs"    move /y "preload.cjs"    "electron\" >nul

rem --- src フォルダへ ---
if exist "main.tsx"       move /y "main.tsx"       "src\" >nul
if exist "App.tsx"        move /y "App.tsx"        "src\" >nul
if exist "index.css"      move /y "index.css"      "src\" >nul
if exist "vite-env.d.ts"  move /y "vite-env.d.ts"  "src\" >nul

rem --- src\components フォルダへ ---
if exist "TitleBar.tsx"   move /y "TitleBar.tsx"   "src\components\" >nul

rem --- src\lib フォルダへ ---
if exist "firebase.ts"    move /y "firebase.ts"    "src\lib\" >nul

rem --- src\types フォルダへ ---
if exist "index.ts"       move /y "index.ts"       "src\types\" >nul

echo  移動が終わりました。確認します。
echo.

set NG=0

call :CHECK "package.json"
call :CHECK "index.html"
call :CHECK "vite.config.ts"
call :CHECK "tsconfig.json"
call :CHECK "tsconfig.node.json"
call :CHECK "tailwind.config.cjs"
call :CHECK "postcss.config.cjs"
call :CHECK ".eslintrc.cjs"
call :CHECK ".gitignore"
call :CHECK "electron\main.cjs"
call :CHECK "electron\preload.cjs"
call :CHECK "src\main.tsx"
call :CHECK "src\App.tsx"
call :CHECK "src\index.css"
call :CHECK "src\vite-env.d.ts"
call :CHECK "src\components\TitleBar.tsx"
call :CHECK "src\lib\firebase.ts"
call :CHECK "src\types\index.ts"

echo.
if %NG%==0 (
  echo ============================================================
  echo  すべて正しい場所にあります。
  echo  次は「1_セットアップ.bat」をダブルクリックしてください。
  echo ============================================================
) else (
  echo ============================================================
  echo  %NG% 個のファイルが見つかりません。
  echo  上の [なし] の行をご確認ください。
  echo ============================================================
)
echo.
pause
exit /b 0

:CHECK
if exist %1 (
  echo   [OK]   %~1
) else (
  echo   [なし] %~1
  set /a NG+=1
)
exit /b 0
