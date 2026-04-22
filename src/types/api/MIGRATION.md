# Migracao de `src/types/api.ts`

Este guia define como decompor o arquivo legado `src/types/api.ts` sem quebra de compatibilidade.

## Objetivo

- Reduzir o acoplamento em um arquivo unico.
- Organizar tipos por dominio/recurso.
- Preservar imports atuais durante a transicao.

## Estrutura-alvo

- `src/types/api/common.ts`
  - `ApiResponse`, `ApiPaginated`, params comuns, tipos base de plucks.
- `src/types/api/resources/<resource>.ts`
  - payloads, params e responses do recurso.
- `src/types/api/domain/<domain>.ts` (opcional na 2a fase)
  - registros de dominio compartilhados (`UserRecord`, `CompanyRecord`, etc.).

## Estrategia sem quebra

1. Criar tipos novos por recurso em `src/types/api/resources`.
2. Atualizar `src/api/resources/<resource>.ts` para importar do novo arquivo.
3. Reexportar os tipos em `src/api/resources/<resource>.ts` para manter compatibilidade.
4. Manter `src/types/api.ts` como facade temporaria.
5. Migrar consumidores gradualmente (composables, views e components).
6. Quando nao houver mais imports legados, remover trechos migrados de `src/types/api.ts`.

## Ordem recomendada

1. Recursos de maior uso (`users`, `branches`, `employees`, `companies`).
2. Recursos de suporte com plucks (`roles`, `permissions`, `sectors`, `shifts`, `scale-types`, `modality-types`).
3. Recursos de menor churn (`audits`, `auth`).

## Checklist por recurso

- Criar `types/api/resources/<resource>.ts`.
- Definir `ListParams`, `CreatePayload`, `UpdatePayload`, `Pluck` e `Response` types.
- Atualizar `api/resources/<resource>.ts` para usar os novos types.
- Garantir fallback de `plucks` (`?? []` ou `?? {}` conforme contrato).
- Validar lint e tipagem.
