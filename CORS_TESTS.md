# 🧪 CORS Security Tests

Este arquivo contém testes práticos para validar a implementação de CORS seguro.

---

## Setup

```bash
# URLs de teste
LOCAL_URL="http://localhost:54321/functions/v1/create-order"
PROD_URL="https://seu-projeto.supabase.co/functions/v1/create-order"

# Payload válido
VALID_PAYLOAD='{"tenant_slug":"test","items":[{"product_id":"1","quantity":1}]}'
```

---

## ✅ Teste 1: Preflight (OPTIONS) com Origem Permitida

```bash
curl -X OPTIONS "$LOCAL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Esperado**:
- Status: 200
- Header: `Access-Control-Allow-Origin: http://localhost:3000`
- Header: `Access-Control-Allow-Methods: POST, OPTIONS`

**Sucesso**: ✅ Se vê os headers CORS acima

---

## ❌ Teste 2: Preflight (OPTIONS) com Origem Bloqueada

```bash
curl -X OPTIONS "$LOCAL_URL" \
  -H "Origin: https://attacker.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Esperado**:
- Status: 200
- **SEM** header `Access-Control-Allow-Origin`

**Sucesso**: ✅ Se NÃO vê CORS headers

---

## ✅ Teste 3: POST com Origem Permitida

```bash
curl -X POST "$LOCAL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  -v
```

**Esperado**:
- Status: 200 (se tenant/produtos existem) ou 400
- Header: `Access-Control-Allow-Origin: http://localhost:3000`
- Response: `{"order_id":"...","total":...}`

**Sucesso**: ✅ Se recebe CORS headers

---

## ❌ Teste 4: POST com Origem Bloqueada

```bash
curl -X POST "$LOCAL_URL" \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  -v
```

**Esperado**:
- Status: 403
- Response: `{"error":"Origin not allowed..."}`
- **SEM** header `Access-Control-Allow-Origin`

**Sucesso**: ✅ Se recebe erro 403

---

## ℹ️ Teste 5: POST sem Origin Header (Server-to-Server)

```bash
curl -X POST "$LOCAL_URL" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  -v
```

**Esperado**:
- Status: 200 (se tenant/produtos existem) ou 400
- Response funciona normalmente
- **Pode não ter** header CORS

**Sucesso**: ✅ Se funciona (sem Origin não há CORS check)

---

## 🔍 Teste 6: Verificar Logs

```bash
# Via Supabase CLI
supabase functions logs create-order --tail

# Procure por:
# "Request rejected: disallowed origin"
# "CORS preflight rejected"
```

**Esperado**:
- Logs de rejeição aparecem para origens inválidas
- Nenhum log para origens permitidas

---

## 📋 Teste 7: Multiple Origins

Configure:
```
ALLOWED_ORIGINS=http://localhost:3000,https://meusite.com,https://app.meusite.com
```

Teste cada uma:
```bash
# Teste 1: localhost
curl -X POST "$LOCAL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD"
# Esperado: 200 com CORS headers ✅

# Teste 2: meusite.com
curl -X POST "$PROD_URL" \
  -H "Origin: https://meusite.com" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD"
# Esperado: 200 com CORS headers ✅

# Teste 3: app.meusite.com
curl -X POST "$PROD_URL" \
  -H "Origin: https://app.meusite.com" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD"
# Esperado: 200 com CORS headers ✅

# Teste 4: invalid.com
curl -X POST "$PROD_URL" \
  -H "Origin: https://invalid.com" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD"
# Esperado: 403 SEM CORS headers ❌
```

---

## 🧩 Teste 8: Browser Integration (JavaScript)

**Teste em DevTools Console** (quando acessar seu site):

```javascript
// Em: http://localhost:3000
fetch('http://localhost:54321/functions/v1/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tenant_slug: 'test',
    items: [{product_id: '1', quantity: 1}]
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));

// Esperado: Sucesso e dados do pedido ✅
```

---

## 🚫 Teste 9: Browser de Origem Inválida

**Teste em DevTools Console** (de attacker.com):

```javascript
// Em: https://attacker.com
fetch('https://seu-projeto.supabase.co/functions/v1/create-order', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({tenant_slug: 'test', items: [{product_id: '1', quantity: 1}]})
})
.then(r => r.json())
.catch(err => console.error(err));

// Esperado: Cross-Origin Request Blocked ❌
// (Vê erro no Console - exato comportamento desejado!)
```

---

## 🔐 Teste 10: Header Validation

Verifique que response tem os headers corretos:

```bash
curl -X POST "$LOCAL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  --include | grep -i "access-control"
```

**Esperado**:
```
access-control-allow-origin: http://localhost:3000
access-control-allow-methods: POST, OPTIONS
access-control-allow-headers: authorization, x-client-info, apikey, content-type
access-control-max-age: 86400
access-control-allow-credentials: false
```

---

## ✨ Teste 11: Verify No Service Role Leak

```bash
# Verifique que resposta NÃO expõe service_role

curl -X POST "$LOCAL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  | grep -i "service_role"

# Esperado: Nenhum match (vazio) ✅
```

---

## 📊 Test Summary Table

| # | Teste | Origem | Method | Status Esperado | CORS Headers | Resultado |
|---|-------|--------|--------|-----------------|--------------|-----------|
| 1 | Preflight | Permitida | OPTIONS | 200 | ✅ Sim | ✅ |
| 2 | Preflight | Bloqueada | OPTIONS | 200 | ❌ Não | ✅ |
| 3 | POST | Permitida | POST | 200/400 | ✅ Sim | ✅ |
| 4 | POST | Bloqueada | POST | 403 | ❌ Não | ✅ |
| 5 | POST | Nenhuma | POST | 200/400 | ℹ️ N/A | ✅ |
| 6 | Logs | - | - | Rejeições | Logadas | ✅ |
| 7 | Multiple | Várias | POST | 200/400/403 | Dinâmico | ✅ |
| 8 | Browser | Permitida | POST | 200/400 | ✅ Sim | ✅ |
| 9 | Browser | Bloqueada | POST | CORS Error | - | ✅ |
| 10 | Headers | Permitida | POST | 200/400 | ✅ Sim | ✅ |
| 11 | No Leak | - | - | - | - | ✅ |

---

## 🚀 Automated Test Script

Salve como `test-cors.sh`:

```bash
#!/bin/bash

BASE_URL="${1:-http://localhost:54321/functions/v1/create-order}"
PAYLOAD='{"tenant_slug":"test","items":[{"product_id":"1","quantity":1}]}'

echo "🧪 CORS Security Tests"
echo "======================"
echo "Target: $BASE_URL"
echo ""

# Test 1
echo "Test 1: Preflight with allowed origin..."
curl -X OPTIONS "$BASE_URL" \
  -H "Origin: http://localhost:3000" \
  -w "\nStatus: %{http_code}\n\n" \
  -s | head -20

# Test 2
echo "Test 2: POST with allowed origin..."
curl -X POST "$BASE_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nStatus: %{http_code}\n\n" \
  -s

# Test 3
echo "Test 3: POST with blocked origin..."
curl -X POST "$BASE_URL" \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nStatus: %{http_code}\n\n" \
  -s

echo "✅ Tests completed!"
```

Uso:
```bash
chmod +x test-cors.sh
./test-cors.sh http://localhost:54321/functions/v1/create-order
```

---

## ✅ Final Checklist

- [ ] Teste 1 passou (Preflight permitido)
- [ ] Teste 2 passou (Preflight bloqueado)
- [ ] Teste 3 passou (POST permitido)
- [ ] Teste 4 passou (POST bloqueado)
- [ ] Teste 5 passou (Server-to-server)
- [ ] Teste 6 verificado (Logs corretos)
- [ ] Teste 7 passou (Multiple origins)
- [ ] Teste 8 passou (Browser permitido)
- [ ] Teste 9 passou (Browser bloqueado)
- [ ] Teste 10 verificado (Headers corretos)
- [ ] Teste 11 verificado (Service role não vazado)

---

**Se todos os testes passarem**: 🎉 Sua Edge Function está segura!
