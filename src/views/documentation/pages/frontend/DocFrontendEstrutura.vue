<template>
  <article class="doc-article">
    <h1>Estrutura do frontend</h1>
    <p class="doc-lead">
      Código em <code>frontend/src/</code>. Separação entre rotas “página” e vistas reutilizáveis.
    </p>

    <h2><code>src/pages/</code></h2>
    <p>
      Arquivos que o router importa como <strong>entrada de rota</strong>: muitas vezes finos,
      compostos por layouts ou views em <code>views/</code>. Ex.: listagens em
      <code>pages/panels/owner/users/index.vue</code>.
    </p>

    <h2><code>src/views/</code></h2>
    <p>
      Ecrãs e fragmentos por domínio: <code>views/panels/owner/users/</code> (formulários, filtros,
      perfil), <code>views/auth/</code>, dashboards por painel. Reutilização entre rotas
      <code>/users</code> e <code>/company/…</code> quando a mesma tela serve vários contextos.
    </p>

    <h2><code>src/components/</code></h2>
    <p>
      UI transversal: tabelas, modais, filtros genéricos (<code>components/filters/</code>),
      cartões de listagem, etc.
    </p>

    <h2><code>src/layouts/</code></h2>
    <p>
      Casca do painel: sidebar, topbar, <code>CompanyWorkspaceLayout.vue</code> para o hub por
      empresa (sub-rotas overview, filiais, setores, …).
    </p>

    <h2><code>src/router/</code></h2>
    <p>
      <code>routes.ts</code> declara paths, nomes, <code>meta.title</code>,
      <code>meta.authRequired</code>, <code>meta.permission</code>, <code>meta.role</code>.
      <code>index.ts</code> aplica guards (sessão, contexto, limites de plano).
    </p>

    <h2><code>src/stores/</code></h2>
    <p>
      Pinia — principalmente <code>auth.ts</code> (usuário, token, <code>can('permission:…')</code>,
      contexto ativo).
    </p>

    <h2><code>src/api/</code></h2>
    <p>
      Cliente HTTP e recursos (endpoints alinhados ao backend), tipos em <code>src/types/</code>
      quando aplicável.
    </p>

    <h2><code>src/helpers/</code></h2>
    <p>
      <code>http-client.ts</code> (Axios, interceptors), utilitários compartilhados.
    </p>
  </article>
</template>
