@echo off
chcp 65001 >nul
if exist "%~dp0src\desktop\release" (
    explorer "%~dp0src\desktop\release"
) else (
    echo مجلد release غير موجود بعد. قم بتشغيل بناء-نسخة-EXE.bat أولاً.
    pause
)
