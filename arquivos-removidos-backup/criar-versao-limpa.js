/**
 * Script para criar uma versão limpa contendo apenas os arquivos essenciais
 * para executar a versão build do Blueprint Sábio.
 * 
 * Este script cria uma cópia organizada com apenas o necessário,
 * sem modificar ou excluir os arquivos originais.
 */

const fs = require('fs');
const path = require('path');

// Pasta de destino para a versão limpa
const CLEAN_DIR = 'blueprint-sabio-clean';

// Lista de arquivos e pastas essenciais para copiar
const essentialFiles = [
  'build',
  'build-backup-20250325',
  'package.json',
  'serve-build.js',
  'serve-build.bat',
  'INSTRUCOES-BUILD.md',
  'BACKUP-PASTA-BUILD.md',
  'ARQUIVOS-ESSENCIAIS.md',
  'README.md',
  'GUIA-ADMIN.md',
  'GUIA-TECNICO.md',
  'DOCUMENTACAO.md',
  'SOLUCAO-PROBLEMAS.md'
];

// Função para copiar arquivo ou diretório recursivamente
function copyFileOrDirectory(source, destination) {
  // Verificar se o arquivo/diretório existe
  if (!fs.existsSync(source)) {
    console.error(`ERRO: ${source} não existe!`);
    return false;
  }

  // Verificar se é um diretório
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    // Criar diretório de destino se não existir
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    // Copiar cada arquivo no diretório
    const files = fs.readdirSync(source);
    for (const file of files) {
      const srcPath = path.join(source, file);
      const destPath = path.join(destination, file);
      copyFileOrDirectory(srcPath, destPath);
    }
  } else {
    // Copiar arquivo
    fs.copyFileSync(source, destination);
  }
  
  return true;
}

// Função principal
function createCleanVersion() {
  console.log(`Criando versão limpa em: ${CLEAN_DIR}`);
  
  // Criar pasta principal se não existir
  if (!fs.existsSync(CLEAN_DIR)) {
    fs.mkdirSync(CLEAN_DIR, { recursive: true });
  }
  
  // Copiar cada arquivo/pasta essencial
  for (const file of essentialFiles) {
    console.log(`Copiando: ${file}`);
    const succeeded = copyFileOrDirectory(file, path.join(CLEAN_DIR, file));
    if (succeeded) {
      console.log(`✓ ${file} copiado com sucesso`);
    }
  }
  
  // Criar arquivo especial package.json limpo
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Limpar dependências não essenciais
  const cleanPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private,
    dependencies: {
      express: packageJson.dependencies.express
    },
    scripts: {
      "serve-build": packageJson.scripts["serve-build"]
    }
  };
  
  // Salvar package.json limpo
  fs.writeFileSync(
    path.join(CLEAN_DIR, 'package.json'),
    JSON.stringify(cleanPackageJson, null, 2),
    'utf8'
  );
  console.log('✓ package.json limpo criado');
  
  // Criar arquivo README.txt com instruções
  const readmeContent = `
# Blueprint Sábio - Versão Limpa

Esta pasta contém apenas os arquivos essenciais para executar a versão compilada (build) 
do Blueprint Sábio que já está funcionando corretamente.

## Como executar o sistema

1. Abra um terminal nesta pasta
2. Execute o comando: npm install express
3. Execute o comando: npm run serve-build
4. Acesse no navegador: http://localhost:3000

Alternativa para Windows: Clique duas vezes no arquivo 'serve-build.bat'

## Arquivos incluídos

- build/ - Aplicação compilada (NÃO MODIFICAR)
- build-backup/ - Backup da aplicação 
- Arquivos de configuração e execução
- Arquivos de documentação

## Credenciais para teste

- Email: teste@exemplo.com
- Senha: senha123

Para mais informações, consulte os arquivos de documentação.
`;
  
  fs.writeFileSync(
    path.join(CLEAN_DIR, 'README.txt'),
    readmeContent,
    'utf8'
  );
  console.log('✓ README.txt criado');
  
  console.log(`
==========================================
✓ Versão limpa criada com sucesso em: ${CLEAN_DIR}
==========================================

O que fazer agora:

1. Verifique a pasta "${CLEAN_DIR}" para garantir que tudo está correto
2. Para executar a aplicação, entre na pasta e execute:
   - No Windows: Clique duas vezes em serve-build.bat
   - Ou execute: cd ${CLEAN_DIR} && npm install express && npm run serve-build
3. Acesse: http://localhost:3000

IMPORTANTE: A pasta original não foi modificada. Esta é uma cópia limpa.
`);
}

// Executar função principal
createCleanVersion();