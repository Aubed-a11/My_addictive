@echo off
REM Double-clique ce fichier, ou tape "start-tout.bat" dans l'invite de commandes (cmd).
REM Lance le script PowerShell equivalent en autorisant son execution pour cette seule fois.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-tout.ps1"
pause
