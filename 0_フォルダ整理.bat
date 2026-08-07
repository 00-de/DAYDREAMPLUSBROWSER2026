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
if not exist "src\hooks"       mkdir "src\hooks"
if not exist "build"           mkdir "build"

rem --- electron フォルダへ ---
if exist "main.cjs"           move /y "main.cjs"           "electron\" >nul
if exist "preload.cjs"        move /y "preload.cjs"        "electron\" >nul

rem --- src フォルダへ ---
if exist "main.tsx"           move /y "main.tsx"           "src\" >nul
if exist "App.tsx"            move /y "App.tsx"            "src\" >nul
if exist "index.css"          move /y "index.css"          "src\" >nul
if exist "vite-env.d.ts"      move /y "vite-env.d.ts"      "src\" >nul

rem --- src\components フォルダへ ---
if exist "TitleBar.tsx"       move /y "TitleBar.tsx"       "src\components\" >nul
if exist "Home.tsx"           move /y "Home.tsx"           "src\components\" >nul
if exist "Clock.tsx"          move /y "Clock.tsx"          "src\components\" >nul
if exist "SearchBar.tsx"      move /y "SearchBar.tsx"      "src\components\" >nul
if exist "ToolTile.tsx"       move /y "ToolTile.tsx"       "src\components\" >nul
if exist "NoticePanel.tsx"    move /y "NoticePanel.tsx"    "src\components\" >nul
if exist "StartupCheck.tsx"   move /y "StartupCheck.tsx"   "src\components\" >nul
if exist "Workspace.tsx"      move /y "Workspace.tsx"      "src\components\" >nul
if exist "PaneWindow.tsx"     move /y "PaneWindow.tsx"     "src\components\" >nul
if exist "Browser.tsx"        move /y "Browser.tsx"        "src\components\" >nul
if exist "WebFrame.tsx"       move /y "WebFrame.tsx"       "src\components\" >nul
if exist "Dock.tsx"           move /y "Dock.tsx"           "src\components\" >nul
if exist "Account.tsx"        move /y "Account.tsx"        "src\components\" >nul
if exist "Dashboard.tsx"      move /y "Dashboard.tsx"      "src\components\" >nul
if exist "DashboardParts.tsx" move /y "DashboardParts.tsx" "src\components\" >nul
if exist "MemberPhoto.tsx"    move /y "MemberPhoto.tsx"    "src\components\" >nul

rem --- src\lib フォルダへ ---
if exist "firebase.ts"        move /y "firebase.ts"        "src\lib\" >nul
if exist "tools.ts"           move /y "tools.ts"           "src\lib\" >nul
if exist "storage.ts"         move /y "storage.ts"         "src\lib\" >nul
if exist "daydream.ts"        move /y "daydream.ts"        "src\lib\" >nul
if exist "status.ts"          move /y "status.ts"          "src\lib\" >nul

rem --- build フォルダへ ---
if exist "icon.ico"           move /y "icon.ico"           "build\" >nul
if exist "icon.png"           move /y "icon.png"           "build\" >nul

rem --- src\hooks フォルダへ ---
if exist "useWorkspace.ts"    move /y "useWorkspace.ts"    "src\hooks\" >nul
if exist "useAuth.ts"         move /y "useAuth.ts"         "src\hooks\" >nul
if exist "useSync.ts"         move /y "useSync.ts"         "src\hooks\" >nul
if exist "useDashboard.ts"    move /y "useDashboard.ts"    "src\hooks\" >nul
if exist "useImageUpload.ts"  move /y "useImageUpload.ts"  "src\hooks\" >nul

rem --- src\types フォルダへ ---
if exist "index.ts"           move /y "index.ts"           "src\types\" >nul

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
call :CHECK "src\components\Home.tsx"
call :CHECK "src\components\Clock.tsx"
call :CHECK "src\components\SearchBar.tsx"
call :CHECK "src\components\ToolTile.tsx"
call :CHECK "src\components\NoticePanel.tsx"
call :CHECK "src\components\StartupCheck.tsx"
call :CHECK "src\components\Workspace.tsx"
call :CHECK "src\components\PaneWindow.tsx"
call :CHECK "src\components\Browser.tsx"
call :CHECK "src\components\WebFrame.tsx"
call :CHECK "src\components\Dock.tsx"
call :CHECK "src\components\Account.tsx"
call :CHECK "src\hooks\useWorkspace.ts"
call :CHECK "src\hooks\useAuth.ts"
call :CHECK "src\components\Dashboard.tsx"
call :CHECK "src\components\DashboardParts.tsx"
call :CHECK "src\lib\daydream.ts"
call :CHECK "src\lib\status.ts"
call :CHECK "src\hooks\useSync.ts"
call :CHECK "src\components\MemberPhoto.tsx"
call :CHECK "src\hooks\useDashboard.ts"
call :CHECK "src\hooks\useImageUpload.ts"
call :CHECK "src\lib\firebase.ts"
call :CHECK "src\lib\tools.ts"
call :CHECK "src\lib\storage.ts"
call :CHECK "src\types\index.ts"
call :CHECK "build\icon.ico"

echo.
if %NG%==0 (
  echo ============================================================
  echo  すべて正しい場所にあります。
  echo  次は「2_開発起動.bat」をダブルクリックしてください。
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
