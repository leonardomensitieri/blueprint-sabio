@echo off
echo Criando versao limpa do Blueprint Sabio...
echo.
echo Este script criara uma nova pasta com apenas os arquivos essenciais
echo para executar a versao build do sistema.
echo.
echo A pasta original permanecera intacta.
echo.
echo Pressione qualquer tecla para continuar...
pause > nul
node criar-versao-limpa.js
echo.
echo Pressione qualquer tecla para fechar...
pause > nul