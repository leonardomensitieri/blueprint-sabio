@echo off
echo Iniciando emuladores do Firebase...
echo.
echo Este script vai iniciar emuladores para testar as funcoes localmente.
echo Certifique-se de que o Firebase CLI esta instalado.
echo.
firebase emulators:start --only functions,firestore
pause