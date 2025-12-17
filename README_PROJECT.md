# Multi-Tenant SAAS - Documentação Técnica

**Versão**: 0.1.0  
**Status**: Production-ready  
**Última atualização**: 17 de Dezembro de 2025

---

## 📋 Visão Geral

Sistema SaaS multi-tenant para gerenciamento de pedidos em restaurantes. Cada usuário cria automaticamente seu próprio tenant (restaurante) ao registrar-se, com suporte a múltiplos usuários por tenant e convites de colaboradores.

**Características principais**:
- ✅ Multi-tenant isolado por segurança (Row Level Security)
- ✅ Autenticação via Supabase Auth (email/magic link)
- ✅ Dashboard gerencial protegido
- ✅ Menu público para clientes
- ✅ Checkout e criação de pedidos (sem autenticação)
- ✅ Edge Functions para operações críticas (pricing)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                   │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Protected Routes │  │   Public Routes  │                │
│  │ (/app/*)         │  │ (/login, /out)   │                │
│  └────────┬─────────┘  └──────────┬───────┘                │
│           │                       │                         │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
            ↓                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL + Auth)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth (RLS)   │  │ Tenants (RLS)│  │ Orders (RLS) │      │
│  │ Users        │  │ Products     │  │ Order Items  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ RPC Functions (Segurança)                            │   │
│  │ - create_order_public (sem auth, com validação)     │   │
│  │ - create_user_on_signup (automático)                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│            EDGE FUNCTIONS (Deno, Pública)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ POST /functions/v1/create-order                      │   │
│  │ - Validação de origem (CORS)                        │   │
│  │ - Chamada segura a RPC (preço do banco)             │   │
│  │ - Sem autenticação necessária                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Stack Técnica

### Frontend
- **Next.js** 16.0.10 (App Router, SSR/SSG)
- **React** 18.3.1
- **TypeScript** 5.5.3 (strict mode)
- **Tailwind CSS** 3.4.17
- **UI Components**: Radix UI + shadcn (60+ componentes)
- **Carrossel**: Embla Carousel
- **Gráficos**: Recharts
- **Forms**: React Hook Form
- **Notificações**: Sonner Toast
- **Calendário**: React Day Picker

### Backend
- **Supabase** (PostgreSQL + Auth)
  - Row Level Security (RLS) para isolamento multi-tenant
  - Real-time subscriptions (opcional)
  - Storage para imagens
  
- **Edge Functions** (Deno)
  - `create-order`: Endpoint público com validação de origem
  - Preço autorizado do banco (nunca do cliente)

### Segurança
- Autenticação: Supabase Auth (JWT tokens)
- Isolamento: PostgreSQL RLS policies
- Autorização: RPC functions serverless
- CORS: Whitelist de origens (configurável)

---

## 📁 Estrutura de Pastas

```
.
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (auth provider)
│   ├── page.tsx                      # Homepage
│   │
│   ├── (app)/                        # Protected routes (requer auth)
│   │   ├── layout.tsx                # Layout com sidebar/header
│   │   ├── dashboard/page.tsx        # Dashboard principal
│   │   ├── pedidos/page.tsx          # Listagem de pedidos
│   │   ├── cardapio/page.tsx         # Gerenciamento de menu
│   │   ├── historico/page.tsx        # Histórico de pedidos
│   │   └── configuracoes/page.tsx    # Configurações do tenant
│   │
│   ├── login/page.tsx                # Login (público)
│   ├── checkout/page.tsx             # Carrinho (público)
│   ├── cardapio-publico/page.tsx     # Menu público (sem auth)
│   │
│   └── globals.css                   # Estilos globais
│
├── components/
│   ├── ui/                           # Componentes reutilizáveis (Radix UI)
│   │   ├── button.tsx, input.tsx, etc.
│   │   └── chart.tsx                 # Wrapper Recharts com tipos corretos
│   │
│   ├── app-header.tsx                # Header da aplicação
│   ├── app-sidebar.tsx               # Sidebar de navegação
│   ├── theme-provider.tsx            # Provedor de tema (dark mode)
│   └── bottom-nav.tsx                # Navegação mobile
│
├── contexts/
│   └── AuthContext.tsx               # Context de autenticação (legacy)
│
├── hooks/
│   ├── useAuth.ts                    # Hook para dados do usuário
│   ├── useTenant.ts                  # Hook para dados do tenant
│   └── use-toast.ts                  # Hook de notificações
│
├── lib/
│   ├── supabase.ts                   # Cliente Supabase
│   └── utils.ts                      # Utilitários (clsx, cn, etc)
│
├── public/
│   └── *.png, *.jpg, *.svg           # Assets estáticos
│
├── supabase/
│   ├── functions/
│   │   └── create-order/
│   │       └── index.ts              # Edge Function (Deno)
│   │
│   └── migrations/
│       ├── *_create_multi_tenant_saas_schema.sql
│       ├── *_create_order_public_rpc.sql
│       └── *_create_user_tenant_trigger.sql
│
├── package.json                      # Dependências npm
├── next.config.mjs                   # Configuração Next.js
├── tsconfig.json                     # Configuração TypeScript
├── tailwind.config.js                # Configuração Tailwind
├── postcss.config.mjs                # Configuração PostCSS
└── README.md                         # Esta documentação
```

---

## 🔐 Segurança & Isolamento Multi-Tenant

### 1. Row Level Security (RLS)

Toda tabela no Supabase tem políticas RLS ativas:

```sql
-- Exemplo: Tabela 'products'
-- Usuário só vê produtos de seu tenant
CREATE POLICY "users can view their tenant's products"
  ON products FOR SELECT
  USING (tenant_id = auth.uid()::uuid);

-- Usuário só pode inserir produtos em seu tenant
CREATE POLICY "users can insert products in their tenant"
  ON products FOR INSERT
  WITH CHECK (tenant_id = auth.uid()::uuid);
```

**Resultado**: Impossível acessar dados de outro tenant via SQL direto.

### 2. RPC Functions (Autenticação Serverless)

Operações críticas vão através de RPC functions:

```typescript
// Frontend (sem segredos expostos)
await supabase.rpc('create_order_public', {
  p_tenant_id: 'tenant-uuid',
  p_items: [{product_id: '...', quantity: 2}],
});

// RPC (no servidor, com validações)
-- Valida tenant existe
-- Valida cada produto pertence ao tenant
-- Busca preço CORRETO do banco (não do cliente)
-- Cria pedido em transação ACID
```

**Resultado**: Impossível fazer pedido fraudulento ou com preço manipulado.

### 3. Edge Function Pública (create-order)

Endpoint público para clientes criarem pedidos SEM autenticação:

```typescript
// Segurança implementada:
1. CORS whitelist (rejeita origem desconhecida)
2. Validação de tenant (deve existir)
3. Validação de preço (busca no banco, nunca no cliente)
4. Transação no banco (tudo ou nada)
5. Logging de rejeições (auditoria)
```

**Resultado**: Clientes podem fazer pedidos, mas sempre validado.

### 4. Autenticação

- **Login**: Magic link via email (sem senha)
- **JWT**: Supabase Auth fornece token
- **Sessão**: Armazenada no cliente (secure HttpOnly cookies opcionais)
- **Logout**: Token revogado, sessão limpa

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

```bash
# Verificar Node.js (v18+)
node --version

# Verificar npm/pnpm
npm --version
pnpm --version
```

### 1. Clonar Repositório

```bash
git clone https://github.com/seu-usuario/Multi-Tenant-SAAS.git
cd Multi-Tenant-SAAS
```

### 2. Instalar Dependências

```bash
# Com npm
npm install

# OU com pnpm (mais rápido)
pnpm install
```

### 3. Configurar Supabase Localmente

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar containers locais
supabase start

# Output:
# API URL: http://localhost:54321
# Anon Key: eyJhbGc...
# Service Role Key: eyJhbGc...
```

**Copie essas chaves para o arquivo `.env.local`**

### 4. Criar Arquivo `.env.local`

```bash
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional: Variáveis adicionais
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Nunca exponha em produção
```

### 5. Rodar Servidor de Desenvolvimento

```bash
npm run dev

# Output:
# ▲ Next.js 16.0.10
# - Local:        http://localhost:3000
# - Environments: .env.local

# Ready in 2.1s
```

### 6. Acessar Aplicação

- **Frontend**: http://localhost:3000
- **Supabase Dashboard**: http://localhost:54321
- **Supabase Studio**: http://localhost:3000 (integrado em localhost)

---

## 🌍 Variáveis de Ambiente

### Desenvolvimento (`.env.local`)

```bash
# SUPABASE - Dados da instância local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Opcional - Service Role (NUNCA em navegador)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Vercel Analytics (opcional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xyz
```

### Staging/Produção (Variáveis do Supabase Cloud)

```bash
# Copiar do Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Edge Function - CORS Whitelist
ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com
```

**⚠️ NUNCA commite `.env.local` ou chaves secretas!**

---

## 📦 Scripts NPM

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em http://localhost:3000

# Build
npm run build            # Compila para produção (Next.js)
npm run start            # Roda servidor compilado

# Linting & Type Check
npm run lint             # Valida ESLint
npm run build            # Valida TypeScript (ignoreBuildErrors: false)

# Supabase
supabase start           # Inicia containers locais
supabase stop            # Para containers
supabase migration list  # Lista migrações
supabase functions deploy create-order  # Deploy Edge Function
```

---

## 🏭 Deploy

### Frontend (Next.js)

**Opção 1: Vercel (Recomendado)**

```bash
# 1. Push para GitHub
git push origin main

# 2. Conectar no Vercel Dashboard
# https://vercel.com/new

# 3. Configurar variáveis de ambiente
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Deploy automático ao fazer push
```

**Opção 2: Docker**

```bash
# Build image
docker build -t multitenant-saas .

# Rodar container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  multitenant-saas
```

### Backend (Supabase)

```bash
# Criar projeto em https://app.supabase.com

# Enviar migrações
supabase db push --project-id seu_project_id

# Deploy Edge Functions
supabase functions deploy create-order --project-id seu_project_id
```

### Verificação de Deploy

```bash
# Teste endpoint
curl https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -H "Origin: https://seu-dominio.com" \
  -d '{"tenant_id": "...", "items": [...]}'
```

---

## 🔍 Monitoramento & Logs

### Local

```bash
# Logs do Next.js (terminal onde rodou npm run dev)
# Logs do Supabase (docker)
docker logs supabase_postgres_1 -f

# Acessar Supabase Studio
# http://localhost:54321
```

### Produção

```bash
# Supabase Dashboard → Logs
# Edge Functions → Metrics & Logs

# Vercel → Deployments → Logs

# PostgreSQL Logs
# Supabase → Database → Logs
```

---

## 🧪 Testes & Validação

### Build Local

```bash
npm run build

# Output esperado:
# ✓ Compiled successfully
# ✓ 11 routes prerendered
# ✓ Zero TypeScript errors
```

### Testes Manuais

#### 1. Fluxo de Login

```bash
# 1. Abrir http://localhost:3000/login
# 2. Digitar email
# 3. Clicar link no email (Supabase envia localmente)
# 4. Ser redirecionado para /dashboard
```

#### 2. Criar Pedido (Public)

```bash
curl -X POST http://localhost:54321/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "tenant_slug": "meu-restaurante",
    "items": [{"product_id": "prod_123", "quantity": 2}]
  }'

# Response esperada:
# {"order_id": "ord_abc", "total": 45.50}
```

---

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| `SUPABASE_URL not found` | Variáveis de ambiente não configuradas | Criar `.env.local` com chaves |
| `Connection refused` | Supabase não rodando | Rodar `supabase start` |
| `RLS policy violation` | Tenant ID incorreto ou usuário sem permissão | Verificar `auth.uid()` e tenant_id |
| `403 Origin not allowed` | CORS bloqueando requisição | Adicionar domain em `ALLOWED_ORIGINS` |
| `TypeScript errors on build` | Imports incorretos ou tipos faltando | Rodar `npm run build` e verificar errors |

---

## 📚 Documentação Adicional

### Arquivos de Documentação Específica

- **[EDGE_FUNCTION_SECURITY.md](EDGE_FUNCTION_SECURITY.md)** - Segurança da função pública de criação de pedidos
- **[CORS_SETUP_GUIDE.md](CORS_SETUP_GUIDE.md)** - Configuração CORS por ambiente
- **[REPOSITORY_HYGIENE_AUDIT.md](REPOSITORY_HYGIENE_AUDIT.md)** - Análise de código morto e estrutura

### Referências Externas

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🔄 Fluxo de Contribuição

### Branch Strategy

```bash
# Feature branch
git checkout -b feature/sua-feature
git push origin feature/sua-feature

# Pull request & review
# Merge para main ao ser aprovado
```

### Padrão de Commits

```
feat: descrição curta (novo recurso)
fix: descrição curta (correção de bug)
docs: descrição curta (documentação)
refactor: descrição curta (refatoração)
chore: descrição curta (tasks/setup)
```

### Antes de Fazer Commit

```bash
npm run lint      # Verifica ESLint
npm run build     # Valida TypeScript
git add .
git commit -m "feat: descrição"
```

---

## ✅ Checklist de Deployment

- [ ] Todas as features testadas localmente
- [ ] Sem erros de build: `npm run build`
- [ ] Sem erros TypeScript: `npm run build`
- [ ] Variáveis de ambiente configuradas (Vercel/Supabase)
- [ ] Migrações de banco executadas
- [ ] Edge Functions deployadas
- [ ] CORS configurado corretamente
- [ ] Testes manuais passaram
- [ ] Logs monitorados após deploy
- [ ] Rollback plan preparado (se necessário)

---

## 📞 Contato & Suporte

- **Issues**: GitHub Issues para bugs e features
- **Documentação**: Ver pasta `docs/` ou arquivos `*.md`
- **Logs**: Supabase Dashboard ou Vercel Logs

---

## 📄 Licença

Proprietário. Todos os direitos reservados.

---

**Versão**: 0.1.0 | **Última atualização**: 17 de Dezembro de 2025 | **Status**: Production-Ready
