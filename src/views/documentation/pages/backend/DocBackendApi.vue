<template>
  <article class="doc-article">
    <h1>API HTTP</h1>
    <p class="doc-lead">
      O frontend usa a variável de ambiente <code>VITE_API_BASE_URL</code> (por defeito
      <code>/api</code> em desenvolvimento com proxy Vite).
    </p>

    <h2>Autenticação</h2>
    <p>
      Laravel Sanctum: após <code>POST /api/login</code>, enviar o token no cabeçalho
      <code>Authorization: Bearer &lt;token&gt;</code> nas rotas protegidas por
      <code>auth:sanctum</code>.
    </p>

    <pre class="doc-pre"><code>POST /api/login
Body: { "email", "password" }
→ { "user", "token", "token_type" }

GET /api/me
Header: Authorization: Bearer …
→ { "user" }</code></pre>

    <h2>Prefixos comuns</h2>
    <p>
      Recursos REST sob <code>/api/users</code>, <code>/api/companies</code>,
      <code>/api/branches</code>, <code>/api/sectors</code>, etc., conforme
      <code>routes/api.php</code>.
    </p>
  </article>
</template>
