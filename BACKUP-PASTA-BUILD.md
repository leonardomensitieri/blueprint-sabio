# Backup da Pasta Build

## O que foi feito

Um backup completo da pasta `build` foi criado automaticamente no dia 25/03/2025.

## Localização do backup

O backup está localizado em:
`/site planilha leo/blueprint-sabio/build-backup-20250325/`

## Como restaurar o backup (se necessário)

Se por algum motivo você precisar restaurar o backup, siga estas instruções:

1. **Através do Explorador de Arquivos**:
   - Copie todo o conteúdo da pasta `build-backup-20250325`
   - Cole na pasta `build`, substituindo todos os arquivos

2. **Através do Terminal**:
   - Abra um terminal
   - Execute: `cp -r "build-backup-20250325"/* "build/"`

## Sobre o backup

Este backup contém a versão compilada e funcional do Blueprint Sábio. É uma cópia exata da pasta `build` original que contém:

- `index.html` - Arquivo principal
- Pasta `static/` com arquivos CSS e JavaScript compilados
- Todos os assets e imagens necessários

## Observações importantes

O backup foi criado como medida de segurança. Os scripts e arquivos criados para servir a aplicação não modificam a pasta `build` original, mas este backup oferece uma proteção adicional.

Em caso de dúvidas, entre em contato com o administrador do sistema.

**Lembre-se**: A pasta `build` contém apenas os arquivos compilados finais. Os arquivos fonte originais estão na pasta `src/`.