@echo off
echo Iniciando deploy das Functions do Firebase...

REM Mudar para o diretório do script
cd /d "%~dp0"

REM Executar o deploy sem linting
echo Usando firebase deploy...
firebase deploy --only functions

echo.
echo Deploy concluído! Verifique no console do Firebase se tudo foi implantado corretamente.
echo.

pause