<template>
  <article class="doc-article">
    <h1>Frontend — índice</h1>
    <p class="doc-lead">
      SPA em Vue 3 + TypeScript + Vite, com Vue Router e Pinia.
    </p>
    <ul>
      <li>
        <router-link :to="{ name: 'documentation.frontend.architecture' }">Arquitetura</router-link>
        — fluxo rota → Page → View → <code>api/</code>.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.frontend.moduloCompleto' }">Módulo completo (exemplo)</router-link>
        — listagem <code>companies</code>.
      </li>
      <li>
        <strong>Pages</strong>, <strong>Views</strong>, <strong>Rotas (Vue Router)</strong>,
        <strong>API (cliente HTTP)</strong> — cada um com submenu Visão / Padrão / Regras.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.frontend.estrutura' }">Pastas e arquivos</router-link>,
        <router-link :to="{ name: 'documentation.frontend.rotas-auth' }">Guards e autenticação</router-link>.
      </li>
    </ul>
  </article>
</template>
