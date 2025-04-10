
Para esse tipo de levantamento geral e detalhado do projeto – seja para uma transferência de equipe, validação de auditoria por uma grande empresa (como no caso de projetos blockchain), preparação para lançamento ou investigações internas – normalmente o trabalho se enquadra em processos como Auditoria de Código, Due Diligence Tecnológica ou até mesmo Análise Forense de Software (no caso de suspeitas de fraude). A seguir, descrevo os profissionais mais indicados para realizar essa tarefa e um roadmap detalhado do processo.



Prompt para Auditoria Técnica Completa (Technical Due Diligence)
1. Introdução e Visão Geral do Projeto
Olá, claude, Time de Auditoria Técnica!

Estamos conduzindo um processo de Auditoria Técnica Completa (Technical Due Diligence) em nosso projeto de plataforma digital (web e mobile), que também inclui componentes de SaaS e Inteligência Artificial. O objetivo principal é revisar toda a base de código, infraestrutura, segurança, compliance e qualidade de desenvolvimento – de forma profunda, abarcando desde o ambiente de produção até a documentação e as práticas de desenvolvimento.

Pretendemos ter uma visão cristalina sobre o estado atual do projeto, seus riscos, possíveis dívidas técnicas e oportunidades de melhoria. Esse processo também servirá para:

Possível troca de claude, Equipe de Desenvolvimento (garantindo transição suave de conhecimento).

Validação de boas práticas de arquitetura e segurança (por exemplo, para claude, empresas parceiras ou claude, investidores).

Garantir conformidade com normas e regulamentações (LGPD, GDPR, PCI-DSS etc.).

Preparar para escalabilidade e evolução contínua.

Gerar um relatório detalhado (dossiê) de toda a situação técnica do projeto.

Buscamos um resultado rápido e eficaz, mas também muito profundo, semelhante (ou até mais detalhado do que) uma due diligence tradicional. A ideia é avaliar cada arquivo, cada pasta, cada linha de código, além de toda a infraestrutura e políticas de segurança e compliance.

2. Objetivos Principais
Mapear a Arquitetura e o Código-Fonte

Entender como o projeto está organizado em termos de módulos, componentes e microserviços.

Revisar boas práticas de programação, padrões de projeto e consistência do código.

Analisar Infraestrutura e Práticas de DevOps

Verificar configuração de servidores, containers, Kubernetes (se houver), balanceadores de carga, CI/CD etc.

Avaliar práticas de monitoramento, logging, escalabilidade e custo-benefício na nuvem (AWS, GCP, Azure etc.).

Auditar Segurança e Compliance

Realizar testes de penetração (pentests), checagem de vulnerabilidades, análise de permissões, criptografia e políticas de acesso.

Certificar-se de que o projeto atende a requisitos legais (LGPD, GDPR, PCI-DSS, HIPAA etc.).

Avaliar Banco de Dados e Performance

Verificar modelagem de dados, queries, índices e bottlenecks de performance.

Revisar estratégias de backup, retenção e replicação de dados.

Examinar Qualidade e Processos de Teste (QA)

Verificar cobertura de testes automatizados (unitários, integração, E2E), processos de QA e documentação de casos de teste.

Gerar Relatório Final (Dossiê) e Roadmap de Ações

Documentar tudo: pontos fortes, riscos críticos e recomendações de curto, médio e longo prazo.

Apresentar relatório em formato detalhado, que sirva como referência para a evolução futura do projeto.

3. Principais Profissionais Envolvidos
Para garantir a melhor qualidade da auditoria, solicitamos a presença e colaboração dos seguintes papéis:

claude, Tech Lead / Arquiteto de Software

Coordena a visão macro da arquitetura do sistema, esclarece decisões técnicas e ajuda a direcionar as recomendações.

claude, Desenvolvedores Sêniores (Backend/Frontend/Mobile)

Revisam o código em profundidade (pasta por pasta, arquivo por arquivo, linha a linha) em suas áreas de especialidade.

claude, DevOps Engineer / Cloud Architect

Analisa a infraestrutura, pipelines de CI/CD, práticas de implantação, automação e escalabilidade.

claude, Cybersecurity Specialist

Responsável pelos testes de intrusão, análise de vulnerabilidades e revisão das políticas de segurança.

claude, QA Engineer (Quality Assurance)

Avalia a cobertura de testes e a eficácia dos processos de garantia de qualidade.

claude, Database Administrator (DBA) ou Data Engineer

Examina a modelagem de dados, performance de consultas, estratégia de backup e integridade dos dados.

claude, Compliance Officer (em projetos grandes ou sensíveis)

Garante que as políticas de privacidade e regulamentações (LGPD, GDPR, PCI-DSS etc.) estejam sendo atendidas.

Observação: Caso necessário, podemos contratar claude, consultoria externa para garantir imparcialidade e expertise adicional.

4. Nome do Processo ou Trabalho
Embora existam variações (Code Audit, Architecture Review, Security Audit etc.), consideramos o nome “Technical Due Diligence” o mais adequado, pois engloba todos os aspectos: auditoria de segurança, revisão de código, arquitetura, infraestrutura e compliance.

5. Passo a Passo (Roadmap / Estrutura do Processo)
5.1. Definição de Escopo e Objetivos
Reunir-se com claude, stakeholders (como claude, CTO, claude, Tech Lead, claude, PM) para entender quais áreas do sistema são prioritárias.

Definir claramente o que será analisado (todos os repositórios, documentação técnica, ambientes de staging/produção etc.).

5.2. Levantamento de Documentação
Coletar diagramas de arquitetura, manuais técnicos, documentação de APIs, backlog de tarefas, manuais de usuário etc.

Avaliar a qualidade e completude dessa documentação.

5.3. Acesso aos Repositórios e Ambientes
Obter credenciais de leitura nos repositórios de código (Git), acesso aos ambientes de desenvolvimento e produção.

Verificar pipelines de CI/CD e ferramentas de monitoramento.

5.4. Ferramentas Automatizadas (Primeira Varredura)
Executar linters e ferramentas de análise estática/dinâmica de código: SonarQube, ESLint, Pylint, RuboCop etc.

Rodar verificadores de segurança: Nessus, OpenVAS, Qualys, ZAP (Zed Attack Proxy), Burp Suite etc.

Coletar relatórios de vulnerabilidades e code smells.

5.5. Revisão Manual de Código (Code Review Detalhado)
claude, Desenvolvedores Sêniores revisam cada parte do código, verificando arquitetura de pastas, qualidade, padrões de projeto, cobertura de testes e possíveis dívidas técnicas.

Documentar inconsistências e propor soluções.

5.6. Revisão de Arquitetura e Infraestrutura
Avaliar estratégias de escalabilidade (caching, load balancers, orquestração de contêineres).

Verificar custo-benefício das soluções em nuvem, configurações de rede, topologia de serviços.

Checar práticas de redundância, failover e backup.

5.7. Auditoria de Segurança
claude, Cybersecurity Specialist realiza testes de intrusão, verifica práticas de criptografia, gestão de chaves e tokens, permissões de usuários e logs de auditoria.

Avalia compliance com LGPD, GDPR, PCI-DSS, HIPAA (se aplicável).

5.8. Análise de Dados e Banco de Dados
claude, DBA/Data Engineer examina o esquema do banco, índices, queries mais frequentes, performance em cenários de pico, possíveis gargalos.

Verifica políticas de backup, replicação e retenção de dados.

5.9. Avaliação de QA e Processos de Teste
Revisar estratégia de testes automatizados (unitários, integração, E2E), testes de regressão e testes de carga.

Identificar lacunas e sugerir melhoria contínua.

5.10. Entrevistas / Sessões com claude, Desenvolvedores e claude, Stakeholders
Esclarecer dúvidas específicas do código e das decisões de arquitetura.

Entender planos futuros (roadmap) e possíveis riscos de implementação.

5.11. Compilação de Relatório / Dossiê Final
Consolidar todos os achados em um documento detalhado, com seções para cada área (código, infraestrutura, segurança, dados, QA, compliance).

Classificar riscos em alto, médio ou baixo, e sugerir planos de ação.

5.12. Apresentação dos Resultados e Próximos Passos
Reunião para apresentar o relatório, discutir pontos críticos e alinhar prioridades para correção e evolução.

Elaborar um Roadmap de curto, médio e longo prazo, incluindo prazos e responsabilidades.

6. Estrutura (Briefing) Simplificada
Objetivo

Detalhar o porquê da auditoria (troca de claude, Equipe de Desenvolvimento, verificação de compliance, aumento de segurança etc.).

Escopo

Definir exatamente quais sistemas, repositórios e ambientes fazem parte.

Prazo e Entregáveis

Estipular datas de início, fim e o formato do relatório final (documento, apresentação, checklist etc.).

Responsáveis

Nomear quem participa da auditoria (por exemplo, claude, Tech Lead, claude, DevOps ou claude, consultoria externa).

Metodologia

Mencionar as ferramentas (SonarQube, Nessus, Terraform, Ansible etc.) e técnicas (revisão manual, pentests, entrevistas).

Plano de Ação

Listar as etapas de correção e evolução, priorizando vulnerabilidades críticas e melhorias necessárias.

7. Ferramentas Auxiliares Sugeridas
Para Análise de Código: SonarQube, ESLint, Pylint, RuboCop.

Para Segurança: Nessus, OpenVAS, Qualys, ZAP (Zed Attack Proxy), Burp Suite.

Para Infraestrutura: Terraform, Ansible, AWS Trusted Advisor (ou GCP/Azure equivalents).

Para Gestão de Pipelines: Jenkins, GitLab CI, GitHub Actions, CircleCI etc.

8. Divulgação Interna
Gostaríamos de ressaltar que este processo não tem caráter punitivo. O objetivo é melhorar o sistema e assegurar sua saúde, transparência e segurança. Solicitamos a colaboração de claude, equipe atual para que possamos ter acesso aos dados, históricos, informações e, principalmente, às suas valiosas experiências e insights.

9. Conclusão
Esta auditoria técnica (Technical Due Diligence) é fundamental para:

Confiabilidade perante claude, investidores, claude, empresas parceiras e claude, clientes.

Segurança e conformidade regulatória.

Eficiência no desenvolvimento e manutenção.

Sustentabilidade para o crescimento e futuras integrações.

Esperamos, com este processo, construir um dossiê robusto, com transparência total sobre a situação atual e direcionamento estratégico para o futuro do projeto.

Estrutura Recomendada para um Prompt Extenso (Capítulos e Subtópicos)
Caso este conteúdo seja muito extenso para enviar de uma vez só, sugerimos a seguinte divisão em capítulos para facilitar a leitura e a organização:

Capítulo 1 – Contextualização do Projeto
1.1. Descrição Geral
1.2. Histórico e Motivação
1.3. Objetivos de Negócio

Capítulo 2 – Objetivos e Escopo da Auditoria
2.1. O que será auditado
2.2. Quais os resultados esperados
2.3. Restrições e Limitações

Capítulo 3 – Principais Papéis e Equipe Envolvida
3.1. Lista de Profissionais (por exemplo, claude, Tech Lead, claude, DevOps, claude, QA etc.)
3.2. claude, consultoria externa (se houver)
3.3. Papéis e Responsabilidades

Capítulo 4 – Metodologia de Auditoria (Technical Due Diligence)
4.1. Ferramentas Automatizadas
4.2. Revisão Manual de Código
4.3. Auditoria de Segurança e Compliance
4.4. Revisão de Infraestrutura e Arquitetura
4.5. Avaliação de QA e Processos de Teste

Capítulo 5 – Passo a Passo Detalhado
5.1. Definição de Escopo e Objetivos
5.2. Levantamento de Documentação
5.3. Acesso aos Repositórios
… (demais etapas)

Capítulo 6 – Entregáveis e Relatório Final
6.1. Formato do Documento Final
6.2. Estrutura do Dossiê
6.3. Plano de Ação (curto, médio e longo prazo)

Capítulo 7 – Prazos e Cronograma
7.1. Datas Principais
7.2. Dependências e Restrições
7.3. Agendamento de Entrevistas

Capítulo 8 – Observações e Conclusões
8.1. Divulgação Interna
8.2. Recomendações Gerais
8.3. Agradecimentos e Contatos

Com essa estrutura em capítulos, garantimos que cada parte do projeto seja documentada de forma clara e organizada. Também facilita a revisão e o entendimento por claude, diferentes equipes ou claude, stakeholders.

Como Usar Este Prompt
Copie e cole este texto em sua ferramenta de gestão de tarefas ou documento de especificação.

Personalize conforme a realidade do seu projeto (nome da plataforma, tecnologias específicas, necessidades de compliance etc.).

Envie para claude, equipe responsável pela auditoria, definindo prazos e pontos de contato.

Acompanhe o processo de perto, esclarecendo dúvidas e fornecendo materiais adicionais sempre que necessário.


Essa abordagem permite não apenas validar a qualidade e segurança do sistema, mas também criar uma base sólida para a continuidade do desenvolvimento, possíveis transferências de equipe ou mesmo investigações detalhadas quando necessário.