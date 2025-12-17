# Legacy - Vite Frontend (Arquivado)

⚠️ **Esta pasta contém código legado e não deve ser usada em produção.**

## O que é isso?

Esta é a versão anterior do frontend do projeto Multi-Tenant SAAS, implementada com **Vite + React**. Ela foi mantida por razões histórico-arquiteturais e pode servir como referência para:

- Componentes básicos de autenticação
- Estrutura inicial do AuthContext
- Exemplos de integração com Supabase
- Histórico de desenvolvimento

## Por que foi movido?

O projeto foi consolidado em **Next.js 16** como seu único framework frontend. A decisão de mover (em vez de remover) este código foi para:

1. ✅ Preservar histórico de desenvolvimento
2. ✅ Manter referência de implementações anteriores
3. ✅ Permitir consultoria em componentes simples
4. ✅ Evitar perda de contexto arquitetural

## O que usar?

**👉 Use a pasta `/app` para o frontend oficial** (Next.js 16)

## Estrutura

```
legacy/
├── App.tsx                  # Root component
├── main.tsx                 # Entry point Vite
├── index.css
├── vite-env.d.ts
├── components/              # UI components básicos
│   ├── AuthFlow.tsx
│   ├── DashboardExample.tsx
│   └── ProtectedRoute.tsx
├── contexts/                # Context API
│   └── AuthContext.tsx
├── hooks/                   # Custom hooks
├── lib/                     # Utilities
│   └── supabase.ts
└── styles/
```

## Como o próximo dev pode usar isso?

1. **Referência**: Consulte `AuthContext.tsx` para ver implementação de autenticação
2. **Componentes**: Copie componentes específicos para `/app` se necessário
3. **Não modifique**: Não faça alterações nesta pasta - é apenas leitura histórica

---

**Data do arquivo**: 17/12/2025  
**Razão**: Consolidação de frontend em Next.js 16
