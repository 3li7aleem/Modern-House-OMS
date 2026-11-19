@echo off
chcp 65001 >nul
title Modern House OMS - تشغيل البرنامج

if exist "%~dp0src\desktop\release\Modern-House-OMS-Portable-1.0.0.exe" (
    echo جاري تشغيل النسخة المحمولة...
    start "" "%~dp0src\desktop\release\Modern-House-OMS-Portable-1.0.0.exe"
    exit /b 0
)

if exist "%~dp0src\desktop\release\win-unpacked\Modern House OMS.exe" (
    echo جاري تشغيل النسخة المباشرة...
    start "" "%~dp0src\desktop\release\win-unpacked\Modern House OMS.exe"
    exit /b 0
)

echo لم يتم العثور على ملف EXE جاهز. جاري تشغيل البرنامج عبر وضع التطوير...
cmd /c npm.cmd run desktop:start
pause
