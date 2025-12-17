# ⚡ Quick Start - Edge Function Security

## TL;DR (Em 5 minutos)

### O Problema
```
❌ ANTES: Qualquer site pode criar pedidos
Access-Control-Allow-Origin: *
```

### A Solução
```
✅ DEPOIS: Apenas domínios autorizados podem criar
ALLOWED_ORIGINS=https://meusite.com
```

---

## 3 Passos para Ativar

### Passo 1: Verificar o Código
✅ Já atualizado em: `supabase/functions/create-order/index.ts`

Contém:
- `getAllowedOrigins()` - Lê whitelist
- `isOriginAllowed()` - Valida origem
- `getCorsHeaders()` - Headers dinâmicos

### Passo 2: Configurar Domínio

**Supabase Dashboard**:
1. Projeto → **Functions**
2. Selecione **create-order**
3. Clique **Environment Variables**
4. Adicione:
   ```
   ALLOWED_ORIGINS=https://meusite.com
   ```
5. **Deploy**

### Passo 3: Testar

```bash
# ✅ Seu domínio (funciona)
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Origin: https://meusite.com" \
  -H "Content-Type: application/json" \
  -d '{"tenant_slug":"rest","items":[{"product_id":"1","quantity":1}]}'

# ❌ Domínio inválido (bloqueado)
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d '{"tenant_slug":"rest","items":[{"product_id":"1","quantity":1}]}'
```

---

## Configurações por Ambiente

### Desenvolvimento
```
# Padrão - já funciona!
http://localhost:3000
http://localhost:3001
```

### Staging
```
ALLOWED_ORIGINS=https://staging.meusite.com
```

### Produção
```
ALLOWED_ORIGINS=https://meusite.com,https://www.meusite.com
```

### Múltiplos Domínios
```
ALLOWED_ORIGINS=https://site1.com,https://site2.com,https://app.meusite.com
```

---

## O Que Mudou

### Para Você (Frontend)
```javascript
// ✅ Código NÃO MUDA
fetch('https://api.supabase.co/functions/v1/create-order', {
  method: 'POST',
  body: JSON.stringify({...})
})
```

### Para Atacantes
```javascript
// ❌ Bloqueado agora
// (scripts de attacker.com recebem erro CORS)
```

---

## Verificar se Funciona

### No Browser
1. Abra seu site em `https://meusite.com`
2. Abra DevTools (F12)
3. Crie um pedido
4. Verifique em **Network**:
   - Response header: `Access-Control-Allow-Origin: https://meusite.com` ✅

### Via Logs
1. Supabase Dashboard
2. Functions → **create-order** → **Logs**
3. Procure por eventos
4. Não deve haver `"Request rejected"` para seu domínio ✅

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Cross-Origin Request Blocked" | Adicionar domínio em `ALLOWED_ORIGINS` |
| Não vê CORS headers | Verificar se domínio está correto (https:// vs http://) |
| Teste com curl recebe 403 | Domínio inválido - é o comportamento esperado! |

---

## Documentação Completa

- **EDGE_FUNCTION_SECURITY.md** - Explicação técnica
- **CORS_SETUP_GUIDE.md** - Como configurar
- **CORS_TESTS.md** - 11 testes práticos
- **EDGE_FUNCTION_IMPLEMENTATION_SUMMARY.md** - Resumo executivo

---

## ✅ Checklist Mínimo

- [ ] Li o código em `supabase/functions/create-order/index.ts`
- [ ] Configurei `ALLOWED_ORIGINS` no Supabase
- [ ] Testei com `curl` (seu domínio funciona)
- [ ] Testei com `curl` (domínio inválido bloqueado)
- [ ] Verifiquei logs da função
- [ ] Testei no browser

---

**Pronto!** Sua Edge Function está segura! 🛡️
