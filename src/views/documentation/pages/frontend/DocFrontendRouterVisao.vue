<template>
  <article class="doc-article">
    <h1>Rotas (Vue Router) — visão geral</h1>
    <p class="doc-lead">
      <code>src/router/routes.ts</code> declara árvore de rotas; <code>router/index.ts</code> aplica
      <strong>guards</strong> antes de cada navegação.
    </p>
    <ul>
      <li><code>meta.authRequired</code> — redireciona para login.</li>
      <li><code>meta.permission</code> / <code>meta.role</code> — alinhados ao token e papéis.</li>
      <li><code>meta.panel</code> — restringe painel owner quando necessário.</li>
      <li>Contexto empresa/filial: fluxo <code>select-context</code> quando há múltiplos contextos.</li>
    </ul>
  </article>
</template>
