<template>
  <article class="doc-article">
    <h1>Backend — índice</h1>
    <p class="doc-lead">
      API Laravel em <code>backend/</code>: Sanctum, serviços, repositories e escopo multi-tenant.
    </p>
    <p>Organização do menu:</p>
    <ul>
      <li>
        <router-link :to="{ name: 'documentation.backend.architecture' }">Arquitetura</router-link>
        — fluxo entre camadas e tabela de arquivos por módulo.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.backend.moduloCompleto' }">Módulo completo (exemplo)</router-link>
        — caso <code>Company</code> (controller → service → repository).
      </li>
      <li>
        <strong>Controllers</strong>, <strong>Services</strong>, <strong>Repositories</strong>,
        <strong>Form Requests</strong>, <strong>Policies</strong>, <strong>Observers</strong> — cada
        um com submenu: Visão geral, Padrão (código), Regras.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.backend.camadas' }">Camadas e fluxo (resumo)</router-link>.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.backend.autorizacao' }">Autorização</router-link>,
        <router-link :to="{ name: 'documentation.backend.migrations' }">Migrations</router-link>,
        <router-link :to="{ name: 'documentation.backend.modelo-dados' }">Modelo de dados</router-link>,
        <router-link :to="{ name: 'documentation.backend.exemplo-users' }">Exemplo Users</router-link>,
        <router-link :to="{ name: 'documentation.backend.api' }">API HTTP</router-link>,
        <router-link :to="{ name: 'documentation.backend.testes' }">Testes (API e front)</router-link>.
      </li>
    </ul>
  </article>
</template>
