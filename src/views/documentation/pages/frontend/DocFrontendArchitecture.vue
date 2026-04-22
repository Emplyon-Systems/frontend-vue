<template>
  <article class="doc-article">
    <h1>Arquitetura — Frontend</h1>
    <p class="doc-lead">
      SPA Vue 3: a rota carrega uma <strong>Page</strong> (entrada), que por sua vez compõe
      <strong>layout</strong> + <strong>View</strong> (UI e lógica de domínio). Dados vêm de
      módulos <code>api/</code> que usam o <code>http-client</code>.
    </p>

    <h2>Fluxo</h2>
    <pre class="doc-pre" v-pre><code>routes.ts (meta: auth, permission)
     → Page.vue (DefaultLayout + View)
     → View.vue (listagem, forms, companiesApi.*)
     → http-client → /api/…</code></pre>

    <h2>Checklist por funcionalidade</h2>
    <div class="doc-table-wrap">
      <table class="doc-table">
        <thead>
          <tr>
            <th>Parte</th>
            <th>Onde</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rota</td>
            <td><code>src/router/routes.ts</code> + guard em <code>router/index.ts</code></td>
          </tr>
          <tr>
            <td>Page</td>
            <td><code>src/pages/panels/.../feature/index.vue</code> (create, edit, view)</td>
          </tr>
          <tr>
            <td>View</td>
            <td><code>src/views/panels/.../feature/</code></td>
          </tr>
          <tr>
            <td>API</td>
            <td><code>src/api/resources/*.ts</code></td>
          </tr>
          <tr>
            <td>Tipos</td>
            <td><code>src/types/api.ts</code> (ou próximo ao recurso)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      No menu, <strong>Pages</strong>, <strong>Views</strong>, <strong>Rotas</strong> e
      <strong>API (cliente)</strong> têm cada um submenu Visão / Padrão / Regras.
      <router-link :to="{ name: 'documentation.frontend.moduloCompleto' }">Módulo completo</router-link>
      mostra o exemplo <code>companies</code>.
    </p>
  </article>
</template>
