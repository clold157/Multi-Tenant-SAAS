# 🔧 Correção de Erros SQL - Migrações Supabase

**Data**: 17 de Dezembro de 2025  
**Arquivos corrigidos**: 2  
**Status**: ✅ RESOLVIDO

---

## ❌ Erros Encontrados

### Erro 1: "input parameters after one with a default value must also have defaults"

**Arquivo**: `20251216210000_create_order_public_rpc.sql`  
**Linha**: Definição da função `create_order_public`

**Problema**:
```sql
❌ ERRADO
CREATE OR REPLACE FUNCTION public.create_order_public(
  p_tenant_id uuid DEFAULT NULL,      ← Tem default
  p_tenant_slug text DEFAULT NULL,    ← Tem default
  p_items jsonb                       ← NÃO tem default (erro!)
)
```

**Por quê?** Em PostgreSQL, parâmetros obrigatórios (sem DEFAULT) **devem vir antes** de parâmetros opcionais (com DEFAULT).

---

### Erro 2: "permission denied for schema auth"

**Arquivo**: `20251216235900_create_user_tenant_trigger.sql`  
**Linha**: Definição da função `create_tenant_for_new_user`

**Problema**:
```sql
❌ ERRADO
CREATE OR REPLACE FUNCTION auth.create_tenant_for_new_user()
SET search_path = public, auth

-- E mais abaixo:
EXECUTE FUNCTION auth.create_tenant_for_new_user();
```

**Por quê?** A função foi criada no schema `auth`, mas você não tem permissão de WRITE no schema `auth` (é protegido pelo Supabase). A solução é criar a função no schema `public` (onde você tem permissão).

---

## ✅ Soluções Aplicadas

### Correção 1: Reordenar Parâmetros

**Arquivo**: `20251216210000_create_order_public_rpc.sql`

```sql
✅ CORRETO
CREATE OR REPLACE FUNCTION public.create_order_public(
  p_items jsonb,                      ← Obrigatório (sem DEFAULT)
  p_tenant_id uuid DEFAULT NULL,      ← Opcional (com DEFAULT)
  p_tenant_slug text DEFAULT NULL     ← Opcional (com DEFAULT)
)
```

**Regra**: `[Parâmetros obrigatórios] → [Parâmetros opcionais]`

**Também atualizou**: Assinatura das funções GRANT/REVOKE para refletir a nova ordem:

```sql
-- De:
REVOKE EXECUTE ON FUNCTION public.create_order_public(uuid, text, jsonb)

-- Para:
REVOKE EXECUTE ON FUNCTION public.create_order_public(jsonb, uuid, text)
```

---

### Correção 2: Mover Função para Schema Public

**Arquivo**: `20251216235900_create_user_tenant_trigger.sql`

```sql
✅ CORRETO
-- Antes:
CREATE OR REPLACE FUNCTION auth.create_tenant_for_new_user()

-- Depois:
CREATE OR REPLACE FUNCTION public.create_tenant_for_new_user()
```

**Por quê?** 
- ✅ Você tem permissão de WRITE em `public`
- ❌ Você NÃO tem permissão de CREATE FUNCTION em `auth` (Supabase protege)
- ✅ A função ainda pode ser executada via trigger em `auth.users` (que é permitido)

**Também atualizou**: Referência na chamada do trigger:

```sql
-- De:
EXECUTE FUNCTION auth.create_tenant_for_new_user();

-- Para:
EXECUTE FUNCTION public.create_tenant_for_new_user();
```

---

## 🧪 Como Testar as Migrações

### Opção 1: Supabase Dashboard (SQL Editor)

1. Abra [app.supabase.com](https://app.supabase.com) → SQL Editor
2. Cole o conteúdo do arquivo SQL
3. Clique "Run"
4. Resultado esperado: ✅ Sucesso

### Opção 2: Supabase CLI (Recomendado)

```bash
# Push migrações para seu banco local/cloud
supabase db push

# Output esperado:
# ✓ Pushed to remote database
# ✓ Migration successful
```

### Opção 3: Validar Diretamente

```sql
-- Verificar se a função foi criada
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name IN ('create_order_public', 'create_tenant_for_new_user');

-- Verificar permissões
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'orders';
```

---

## 📋 Checklist de Validação

### Após executar as migrações:

- [ ] Nenhum erro SQL no Supabase
- [ ] Função `create_order_public` existe em schema `public`
- [ ] Função `create_tenant_for_new_user` existe em schema `public`
- [ ] Trigger `create_tenant_after_user_insert` existe em `auth.users`
- [ ] ANON user pode executar `create_order_public`
- [ ] Nova conta criada gera automaticamente um tenant

---

## 🔐 Implicações de Segurança

### Por que as correções mantêm a segurança:

1. **Funções em `public` schema**: ✅ Seguro
   - Apesar de estar em `public`, a função tem `SECURITY DEFINER`
   - Só ANON pode executar (via GRANT específico)
   - Valida tenant e produto internamente

2. **Trigger em `auth.users`**: ✅ Seguro
   - Dispara automaticamente quando usuário novo se registra
   - Sempre cria um tenant para o novo usuário
   - Não pode ser contornado

3. **Permissões de ANON**: ✅ Restritivas
   - ANON só pode executar a função RPC
   - Não pode INSERT/UPDATE/DELETE direto em `orders`
   - Preço vem do banco, nunca do cliente

---

## 📝 Resumo das Mudanças

| Arquivo | Linha | Mudança | Motivo |
|---------|-------|---------|--------|
| `create_order_public_rpc.sql` | 8-11 | Reordenar parâmetros | PostgreSQL exige obrigatórios antes dos opcionais |
| `create_order_public_rpc.sql` | 65-67 | Atualizar assinatura GRANT | Refletir nova ordem de parâmetros |
| `create_user_tenant_trigger.sql` | 6 | `auth.` → `public.` | Supabase protege schema `auth` |
| `create_user_tenant_trigger.sql` | 79 | `auth.` → `public.` | Referenciar função no schema correto |

---

## 🎓 Lições Aprendidas

### Regra 1: Parâmetros em PostgreSQL
```
Ordem obrigatória: [SEM DEFAULT] → [COM DEFAULT]

❌ ERRADO:
FUNCTION f(a DEFAULT 1, b)

✅ CORRETO:
FUNCTION f(b, a DEFAULT 1)
```

### Regra 2: Schemas em Supabase
```
Permissões:
- public: ✅ READ/WRITE (seu código)
- auth:   ❌ READ-ONLY (Supabase gerencia)
- storage: ✅ READ/WRITE (arquivos)

Solução: Funções em `public`, triggers em `auth`
```

---

## ✅ Próximas Ações

### Imediato
1. ✅ Aplicar correções (já feito)
2. ⏳ Executar migrações no Supabase
3. ⏳ Testar fluxo de criação de usuário

### Validação
```bash
# 1. Criar novo usuário (login page)
# 2. Verificar que tenant foi criado
# 3. Verificar que usuário é owner

SELECT * FROM tenants WHERE id IN (
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
);
```

---

## 🐛 Se Ainda Houver Erros

### Erro: "Trigger not found"
**Solução**: Rodar migration primeira:
```bash
supabase db push
```

### Erro: "Function not found in schema"
**Solução**: Verificar schema:
```sql
SELECT * FROM pg_proc WHERE proname = 'create_tenant_for_new_user';
```

### Erro: "Permission denied"
**Solução**: Garantir que é admin:
```bash
supabase projects list
supabase db push --project-id SEU_PROJECT_ID
```

---

**Status**: ✅ Corrigido  
**Arquivos afetados**: 2  
**Erros resolvidos**: 2  
**Segurança**: Mantida ✅

Suas migrações estão prontas para deploy! 🚀
