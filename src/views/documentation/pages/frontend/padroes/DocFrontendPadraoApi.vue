<template>
  <article class="doc-article">
    <h1>Padrão chamada à API (frontend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> funções que chamam endpoints REST; erros tratados no
      cliente HTTP quando possível.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Prefixo base via <code>VITE_API_BASE_URL</code> (proxy em dev).</li>
      <li>Token Bearer via store de auth / interceptor.</li>
      <li>Nomes de métodos alinhados ao backend: <code>list</code>, <code>getById</code>, <code>create</code>, <code>update</code>, <code>delete</code>, <code>plucks</code>.</li>
    </ul>
  </article>
</template>
