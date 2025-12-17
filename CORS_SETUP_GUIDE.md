# 🔐 CORS Security Configuration Guide

## Quick Start

### 1️⃣ Desenvolvimento Local
A configuração padrão já funciona:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 2️⃣ Produção
Configure seu domínio no Supabase Dashboard:

**Passos**:
1. Acesse: **Supabase Dashboard** → seu projeto
2. Clique em **Functions** na sidebar
3. Selecione **create-order**
4. Abra a aba **Environment Variables**
5. Adicione/atualize:
   ```
   ALLOWED_ORIGINS=https://meusite.com
   ```
6. Se tiver múltiplos domínios:
   ```
   ALLOWED_ORIGINS=https://meusite.com,https://www.meusite.com,https://app.meusite.com
   ```
7. Clique em **Deploy** ou **Save**

---

## Testes

### ✅ Teste 1: Origem Permitida
```bash
# Deve funcionar
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "seu-restaurante",
    "items": [
      {"product_id": "prod-1", "quantity": 1}
    ]
  }'

# Resposta esperada:
# HTTP 200 com CORS header:
# Access-Control-Allow-Origin: http://localhost:3000
```

### ❌ Teste 2: Origem Não Permitida
```bash
# Deve ser bloqueado
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "seu-restaurante",
    "items": [{"product_id": "prod-1", "quantity": 1}]
  }'

# Resposta esperada:
# HTTP 403: "Origin not allowed"
# SEM CORS header (browser bloqueia)
```

### ℹ️ Teste 3: Sem Origin Header
```bash
# Permitido (server-to-server)
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "seu-restaurante",
    "items": [{"product_id": "prod-1", "quantity": 1}]
  }'

# Resposta esperada:
# HTTP 200 com dados do pedido (sem CORS header)
```

---

## Comportamento Esperado

### Browser + Origem Permitida ✅
```javascript
// No seu frontend (http://localhost:3000)
fetch('https://seu-projeto.supabase.co/functions/v1/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tenant_slug: 'seu-restaurante',
    items: [{product_id: 'prod-1', quantity: 1}]
  })
})
.then(r => r.json())
.then(data => console.log('Pedido criado:', data.order_id))
```

**Resultado**: ✅ Sucesso - Pedido criado

### Browser + Origem NÃO Permitida ❌
```javascript
// No seu browser de attacker.com
fetch('https://seu-projeto.supabase.co/functions/v1/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_slug: 'seu-restaurante',
    items: [{product_id: 'prod-1', quantity: 1}]
  })
})
```

**Resultado**: ❌ Cross-Origin Request Blocked  
```
Access to XMLHttpRequest at 'https://seu-projeto.supabase.co/functions/v1/create-order'
from origin 'https://attacker.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check.
```

---

## Troubleshooting

### Problema: "Cross-Origin Request Blocked"

**Solução 1**: Verificar se a origem está na whitelist
```
Domínio frontend: https://meusite.com
ALLOWED_ORIGINS: https://meusite.com ✅

Domínio frontend: https://app.meusite.com
ALLOWED_ORIGINS: https://meusite.com ❌ (Não incluiu subdomain)
```

**Solução 2**: Adicionar http:// ou https:// conforme necessário
```
❌ WRONG: ALLOWED_ORIGINS=meusite.com
✅ RIGHT: ALLOWED_ORIGINS=https://meusite.com
```

**Solução 3**: Múltiplos domínios (com vírgula e sem espaços)
```
✅ ALLOWED_ORIGINS=https://meusite.com,https://app.meusite.com
❌ ALLOWED_ORIGINS=https://meusite.com, https://app.meusite.com (espaço extra!)
```

### Problema: Edge Function retorna 403

Verifique os logs:
1. Dashboard → **Functions** → **create-order** → **Logs**
2. Procure por: `Request rejected: disallowed origin`
3. Adicione a origem em `ALLOWED_ORIGINS`

### Problema: OPTIONS preflight falha

Não precisa fazer nada! A função trata automaticamente.
Se ainda tiver erro, verifique `CORS preflight rejected` nos logs.

---

## Configurações Úteis

### Apenas Desenvolvimento
```
ALLOWED_ORIGINS=http://localhost:3000
```

### Desenvolvimento + Staging
```
ALLOWED_ORIGINS=http://localhost:3000,https://staging.meusite.com
```

### Múltiplos Domínios + Subdomains
```
ALLOWED_ORIGINS=https://meusite.com,https://www.meusite.com,https://app.meusite.com,http://localhost:3000
```

### Sem Configuração (usa defaults)
```
# Se não definir ALLOWED_ORIGINS, usa:
# http://localhost:3000
# http://localhost:3001
```

---

## Security Best Practices

1. ✅ **Nunca use wildcard `*`** em produção
2. ✅ **Use `https://` para produção**, não `http://`
3. ✅ **Revise as origens permitidas** regularmente
4. ✅ **Monitore os logs** de rejeção de CORS
5. ✅ **Teste com origens inválidas** antes de deploy
6. ✅ **Use environment variables** diferentes para dev/prod

---

## Reference

### Request Lifecycle

```
Browser Request → Origin Header?
                      ↓
                  Validação CORS
                      ↓
              ✅ Permitida / ❌ Bloqueada
                      ↓
            Response com/sem CORS headers
                      ↓
            Browser aplica CORS policy
```

### Response Headers

**Se origem é permitida:**
```
Access-Control-Allow-Origin: https://meusite.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: false
```

**Se origem é bloqueada:**
```
(Nenhum header CORS)
```

---

## Checklist de Deploy

- [ ] Identifiquei meu domínio de produção
- [ ] Adicionei ao `ALLOWED_ORIGINS` no Supabase
- [ ] Testei com `curl` que origem é permitida
- [ ] Testei com `curl` que origem inválida é bloqueada
- [ ] Verifiquei os logs da função
- [ ] Testei no browser com DevTools aberto
- [ ] Confirmei que pedidos legítimos funcionam
- [ ] Confirmei que pedidos inválidos são bloqueados

---

**Tudo pronto!** 🎉 Sua Edge Function está segura contra abuso de CORS.
