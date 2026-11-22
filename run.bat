@echo off
echo ============================================================
echo   Starting InkGrade AI - Handwritten Worksheet Voice Tutor
echo   Gemini Buildathon Submission
echo ============================================================

cd /d "%~dp0"

set VENV_PY="C:\Users\anand\.gemini\antigravity\scratch\ohthatsme\.venv\Scripts\python.exe"

if exist %VENV_PY% (
    %VENV_PY% app.py
) else (
    python app.py
)
pause
