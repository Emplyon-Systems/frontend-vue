<template>
  <article class="doc-article">
    <h1>API (cliente HTTP) — visão geral</h1>
    <p class="doc-lead">
      Módulos em <code>src/api/resources/</code> encapsulam verbos HTTP contra a API Laravel. O
      prefixo vem de <code>VITE_API_BASE_URL</code> + instância Axios em
      <code>helpers/http-client.ts</code>.
    </p>
    <ul>
      <li>Um arquivo por recurso REST principal (<code>companies.ts</code>, <code>users.ts</code>).</li>
      <li>Métodos nomeados como no backend conceitualmente: <code>list</code>, <code>getById</code>, <code>create</code>, …</li>
      <li>Tipos de payload e de resposta exportados para as views.</li>
    </ul>
  </article>
</template>
