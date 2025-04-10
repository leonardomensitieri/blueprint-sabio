# Instruções para usar a versão compilada (build)

Este documento explica como executar a versão compilada do Blueprint Sábio que já está funcionando corretamente.

## Executando a versão compilada

Existem duas maneiras de executar a versão compilada:

### Opção 1: Usando o arquivo .bat (Windows)

1. Clique duas vezes no arquivo `serve-build.bat` no diretório principal
2. O servidor será iniciado automaticamente e você verá uma janela de terminal com instruções
3. Acesse `http://localhost:3000` no seu navegador
4. Para parar o servidor, pressione `Ctrl+C` na janela do terminal ou feche-a

### Opção 2: Usando npm (Windows, Mac ou Linux)

1. Abra um terminal ou prompt de comando
2. Navegue até a pasta do projeto: `cd "caminho/para/blueprint-sabio"`
3. Instale as dependências necessárias (apenas na primeira vez): `npm install express`
4. Execute o comando: `npm run serve-build`
5. Acesse `http://localhost:3000` no seu navegador
6. Para parar o servidor, pressione `Ctrl+C` no terminal

## Observações importantes

- Esta é a versão pré-compilada que funcionava anteriormente
- Não modifique os arquivos na pasta `build/` para evitar problemas
- Se precisar fazer alterações, edite os arquivos fonte e use `npm run build` para gerar uma nova versão

## Resolução de problemas

Se você encontrar problemas ao iniciar o servidor:

1. Verifique se o Node.js está instalado no seu computador
2. Verifique se a porta 3000 não está sendo usada por outro programa
3. Execute `npm install express` para garantir que a dependência está instalada
4. Se o problema persistir, tente reiniciar o computador e tentar novamente

## Dados de login

Use as seguintes credenciais para acessar o sistema:

- Email: teste@exemplo.com
- Senha: senha123

## Contato

Se precisar de ajuda adicional, entre em contato com o administrador do sistema.