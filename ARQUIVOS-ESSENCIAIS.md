# Arquivos Essenciais para Executar a Build

Esta é a lista de arquivos absolutamente necessários para executar a versão compilada (build) do Blueprint Sábio:

## Arquivos essenciais:

1. **Pasta `build/`** - Contém a aplicação compilada
2. **Pasta `build-backup-20250325/`** - Backup da aplicação compilada
3. **`package.json`** - Definições de dependências e scripts
4. **`serve-build.js`** - Script para servir a aplicação
5. **`serve-build.bat`** - Script para iniciar o servidor no Windows
6. **`INSTRUCOES-BUILD.md`** - Instruções de uso
7. **`BACKUP-PASTA-BUILD.md`** - Informações sobre o backup

## Arquivos úteis para referência:

1. **`README.md`** - Documentação principal do projeto
2. **`GUIA-ADMIN.md`** - Guia de administração
3. **`GUIA-TECNICO.md`** - Guia técnico
4. **`DOCUMENTACAO.md`** - Documentação geral
5. **`SOLUCAO-PROBLEMAS.md`** - Soluções de problemas comuns

## Arquivos opcionais:

1. Arquivos de configuração do Firebase (se estiver usando a versão hospedada)
   - `firebase.json`
   - `.firebaserc`
   - `firestore.rules`
   - `firestore.indexes.json`

## O que pode ser removido:

1. Pasta `node_modules/` (pode ser reinstalada com `npm install express`)
2. Pasta `src/` (código fonte original)
3. Arquivos de desenvolvimento e configuração:
   - `.env*`
   - `.gitignore`
   - `*.test.*`
   - `tsconfig.json`
4. Scripts não utilizados para a versão build:
   - `set-admin*.js`
   - `admin-*.js`
   - `test-*.js`
   - `*-deps.*`
5. Documentação específica de desenvolvimento
6. Pastas temporárias ou de referência
   - `reference_images/`

**IMPORTANTE**: Antes de remover qualquer arquivo, certifique-se de que o backup está completo e funcionando.