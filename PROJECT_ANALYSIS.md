# Análise do Projeto: Multi-Tenant-SAAS

Data: 2025-12-17

Resumo executivo
-----------------
- Projeto é uma aplicação **Next.js 16** (pasta `app/`) com frontend oficial. O `src/` anterior foi movido para `/legacy` como referência de uma versão anterior com Vite. O `package.json` expõe scripts Next únicos: `dev`, `build`, `start` e `lint`.
- Backend de persistência e auth baseado em Supabase/Postgres com um esquema multi-tenant robusto (RLS, triggers, funções RPC). Há também uma Edge Function (Deno) pública para criação de pedidos.
- Migrações mostram um design cuidadoso: enums, tabelas com `tenant_id`, índices, triggers de `updated_at` e políticas RLS por tabela.

Inventário rápido
-----------------
- Configs: `package.json`, `next.config.mjs`, `tsconfig.json` (Next.js oficial).
- Frontend: `app/` (Next.js 16 + app router). Contém rotas como `login`, `checkout`, `cardapio-publico`, `dashboard`, `pedidos`, `historico`, `configuracoes`.
- Legacy: `/legacy` (arquivado) — versão anterior em Vite para referência histórica.
- Supabase: `supabase/migrations/` (3 migrações principais) e `supabase/functions/create-order/index.ts` (Edge Function Deno).
- Documentação: `AUTH_FLOW_DOCUMENTATION.md` (detalhada), `README.md` (mínimo).

Dependências-chave
------------------
- `next` 16.0.10, `react` 18.3.x, `@supabase/supabase-js` ^2.57.4.
- Dev: `typescript`, `tailwindcss`, `eslint`.

Arquitetura e fluxos
---------------------
- Autenticação: Supabase Auth. Ao criar um usuário, um trigger (`auth.create_tenant_for_new_user`) automaticamente cria um `tenant` para o usuário e associa `tenant_users` com role `owner`.
- Isolamento: Row-Level Security (RLS) aplicado em todas as tabelas de domínio, com policies que checam `tenant_users` e `auth.uid()`.
- Pedidos públicos: existe uma RPC `public.create_order_public(uuid,text,jsonb)` (SECURITY DEFINER) para criação pública de pedidos sem autenticação. A RPC valida tenant por id/slug, valida que produtos pertencem ao tenant, obtém preços autoritativos no BD e insere `orders` + `order_items` em transação.
- Edge Function: `supabase/functions/create-order/index.ts` expõe endpoint HTTP público que valida payload e chama a RPC `create_order_public`. Ela usa o ANON key e tem CORS aberto (`Access-Control-Allow-Origin: *`).

Revisão das migrations (resumo técnico)
--------------------------------------
- `20251215081657_create_multi_tenant_saas_schema.sql`:
  - Define enums (`user_role`, `order_status`, `payment_status`, `subscription_status`).
  - Cria tabelas: `tenants`, `tenant_users`, `subscriptions`, `payments`, `categories`, `products`, `product_variations`, `orders`, `order_items`.
  - Índices específicos por `tenant_id` e composições para consultas comuns (status, display_order, created_at desc).
  - Ativa RLS em todas as tabelas e adiciona policies por operação (SELECT/INSERT/UPDATE/DELETE) baseadas em `tenant_users` e roles (`owner`, `admin`, `staff`).
  - Cria triggers `update_updated_at_column()` para manter `updated_at` automaticamente.
  - Observação: política de segurança é granular e consistente para os casos cobertos pela migração.

- `20251216210000_create_order_public_rpc.sql`:
  - Implementa `public.create_order_public(...)` como `SECURITY DEFINER` que:
    - valida payload e tenant (id ou slug);
    - cria uma entrada em `orders` (status `pending`) e inserções em `order_items` calculando valores a partir do preço autoritativo em `products`;
    - só concede `EXECUTE` do RPC ao role `anon` e `authenticated`, mas não dá INSERT direto em `orders`/`order_items` para `anon`.
  - Observação: bom design — centraliza validações e garante que preços são os do banco.

- `20251216235900_create_user_tenant_trigger.sql`:
  - Cria função `auth.create_tenant_for_new_user()` registrada como trigger em `auth.users` AFTER INSERT.
  - A função cria automaticamente um `tenant` (slug único) e associa o novo usuário como `owner` na tabela `tenant_users` de forma idempotente.
  - Tratamento de erros intencional para não bloquear a criação do usuário (apenas `RAISE NOTICE`).

Revisão da Edge Function `create-order` (supabase/functions/create-order/index.ts)
--------------------------------------------------------------------------------
- Implementação Deno (Supabase Edge Function) que aceita POST JSON com `tenant_id` ou `tenant_slug` e `items`.
- Faz validações de payload (limites: `MAX_ITEMS`, `MAX_QUANTITY`, comprimento de IDs).
- Usa ANON key do Supabase (obtida via `Deno.env`) para instanciar client e invocar `rpc('create_order_public', ...)`.
- CORS: define `Access-Control-Allow-Origin: *` e permite `POST, OPTIONS`.
- Opção `FORWARD_AUTH_HEADER` para repassar header `Authorization` é opt-in via env (bom que não é padrão).

Problemas / Riscos detectados
-----------------------------
1) Dual-stack Frontend confuso
   - `app/` (Next) e `src/` (Vite) coexistem. `package.json` tem scripts apenas para Next. Risco: confusão sobre qual app é o principal. Recomendo documentar claramente ou remover o código legacy.

2) `typescript.ignoreBuildErrors: true` em `next.config.mjs`
   - Permite builds com erros de tipagem. Em produção isso pode mascarar regressões. Recomendo remover/definir para `false` e corrigir os erros de types.

3) CORS aberto na Edge Function
   - `Access-Control-Allow-Origin: *` permite qualquer origem criar pedidos publicamente. Se o objetivo é permitir pedidos de qualquer site, documente e monitore; caso contrário, restringir para domínios permitidos ou implementar rate-limiting/antifraud.

4) Uso de ANON Key em funções públicas
   - A Edge Function usa a `SUPABASE_ANON_KEY` o que é aceitável para workflows públicos. Nunca usar `service_role` aqui. Confirmar que `SUPABASE_ANON_KEY` não está exposta em repositório (ver `.gitignore` inclui `.env*` — bom).

5) Logs e exposição de erros
   - A função registra erros (`console.error`) mas retorna mensagens genéricas; isso é bom. Garantir que logs não exponham chaves em caso de stack traces.

6) RPC exec perms
   - A RPC é `SECURITY DEFINER` e liberada para `anon`. Isso é correto para pedidos públicos, mas garanta que a função filtre/invalide campos extras (ex.: metadados) e que não haja RPC paralelas que permitam alterações sem checagens de tenant.

7) Limites e validações
   - A validação no RPC e na Edge Function cobre casos básicos (quantidade, produto pertence ao tenant). Considere adicionar validações de encomenda (ex.: máximos por pedido por tenant, checagem de estoque se aplicável).

Recomendações (prioridade alta → baixa)
-------------------------------------
- Alta
  - Remover `typescript.ignoreBuildErrors: true` e corrigir erros de tipo.
  - Revisar CORS da Edge Function: se não for intencionalmente pública para qualquer site, substituir `*` por lista de origens permitidas ou usar validação de `Origin` e bloquear requests suspeitos.
  - Confirmar que nenhuma chave sensível (service role) aparece no repositório; manter `.env*` no `.gitignore` e usar secret manager no deploy.

- Média
  - Documentar arquitetura: indicar qual frontend é o principal e propósito de `src/` (mover para `examples/` se for demo).
  - Adicionar monitoramento/alertas para Edge Function (taxa de erros, tráfego por origem) e rate-limiting para evitar abuso.
  - Revisar políticas RLS adicionais para casos de edge (p.ex. relatórios, backups, jobs). Auditoria das roles `authenticated` vs `anon`.

- Baixa
  - Expandir validações do RPC: limites de valor total do pedido, validação de cupom, checagem de disponibilidade por variação.
  - Adicionar testes unitários simples para a função RPC (p.ex., em um ambiente de integração local usando uma DB de testes).

Passos imediatos sugeridos (tarefa recomendada)
---------------------------------------------
1. Corrigir `next.config.mjs` para não ignorar erros de TypeScript e rodar `npm run build` para encontrar issues.
2. Decidir destino do `src/` (mover, documentar, ou integrar). Atualizar `README.md` com instruções de dev e deploy.
3. Atualizar Edge Function CORS: se for permitir pedidos somente do front oficial, restringir `Origin`. Caso contrário, adicionar mitigação (rate limit, captchas, validação heurística).
4. Fazer revisão de secrets e pipeline CI (integração com secret manager para `SUPABASE_ANON_KEY`).

Comandos úteis para dev/local
-----------------------------
Instalação (assumindo Node + pnpm/npm):

```powershell
npm install
npm run dev
```

Build Next (local):

```powershell
npm run build
npm start
```

Observações finais
------------------
O projeto demonstra um bom design de banco de dados multi-tenant com RLS e utilização cuidadosa de RPCs para operações públicas. Os principais pontos a melhorar são operacionais (documentação/clareza sobre múltiplos frontends), endurecimento de build/CI e atenção à política de CORS/abuso na função pública.

Se quiser, eu posso:
- Rodar `npm run build` aqui e relatar erros encontrados (posso tentar localmente no workspace).
- Aplicar patches sugeridos (ex.: desabilitar `ignoreBuildErrors`, ajustar CORS para uma lista de origens configurável) e criar PR com as mudanças.

Fim do relatório.
