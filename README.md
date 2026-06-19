# 🏖️ BeachBar App

Sistema completo de pedidos para barracas de praia, com QR Code por guarda-sol, login via Google, múltiplos níveis de acesso, suporte multi-empresa e sugestões de IA para os garçons.

## ✨ Funcionalidades

### Cliente
- Login via Google (OAuth 2.0)
- Identificação automática do guarda-sol via QR Code
- Cardápio com Comidas, Porções e Bebidas
- Carrinho de pedidos e acompanhamento de status em tempo real
- Selo de cliente VIP / recorrente com atendimento prioritário

### Garçom
- Painel de pedidos ativos por guarda-sol
- Atualização de status (Aceitar → A caminho → Entregue)
- Dicas de upsell geradas por IA (Claude), baseadas no consumo de cada mesa

### Administrador / Super Administrador
- Dashboard com faturamento, tempo médio de entrega, pedidos por hora
- Ranking de guarda-sóis por faturamento
- Insights gerados por IA
- Gestão de pedidos, cardápio e clientes (com conformidade LGPD)
- **Geração de QR Codes em lote** para todos os guarda-sóis, prontos para impressão
- Configuração multi-empresa
- Controle de acesso por nível (Super Admin, Admin, Atendente, Garçom, Cliente)

## 🔒 Conformidade LGPD

- Consentimento explícito coletado no login
- Dados criptografados (AES-256)
- Tokens JWT com expiração
- Logs de auditoria
- Direito de exclusão de dados do cliente
- DPO indicado no painel administrativo

## 🤖 Integração com IA

O app chama a API da Anthropic (Claude) para gerar, em tempo real, sugestões de venda adicional (upsell) e reativação de mesas, com base no cardápio e nos pedidos ativos. Há fallback automático caso a API esteja indisponível.

## 🔲 QR Codes

Cada guarda-sol recebe um QR Code único, gerado dinamicamente, apontando para `seuapp.com/?guardasol=N`. Ao escanear, o cliente é identificado automaticamente e segue direto para o login.

## 🛠️ Stack

- React (componentes funcionais + Hooks)
- Estilização inline (CSS-in-JS) com tokens de design centralizados
- `qrcodejs` (via CDN) para geração de QR Codes
- API Anthropic (`claude-sonnet-4-6`) para sugestões de IA

## 📂 Estrutura

```
beachbar-app/
├── src/
│   └── App.jsx       # Aplicação completa (login, cliente, garçom, admin)
└── README.md
```

## 🚀 Como usar

Este projeto foi desenvolvido como um artifact React standalone. Para rodar localmente, integre o `src/App.jsx` a um projeto React (Vite ou Create React App) e instale as dependências necessárias (`react`, `react-dom`).

## ⚠️ Status

Protótipo funcional com dados simulados (mock). Para produção, é necessário:
- Configurar OAuth do Google real (Google Identity Services)
- Conectar a um backend/banco de dados real (pedidos, clientes, cardápio)
- Configurar a chave de API da Anthropic em variável de ambiente segura no backend (nunca no client-side)
- Implementar notificações push para garçons/clientes
