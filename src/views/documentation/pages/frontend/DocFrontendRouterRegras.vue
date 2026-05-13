<template>
  <article class="doc-article">
    <h1>Rotas — regras</h1>
    <ul>
      <li>Nome de rota estável (<code>name:</code>) para <code>router.push({ name })</code> e evitar links frágeis.</li>
      <li><code>meta.title</code> para o título do separador (função <code>setTitle</code> do projeto).</li>
      <li>Lógica condicional pesada de negócio não deve ir para o guard — só redirecionamentos e checagens de sessão/permissão.</li>
      <li>Lazy import: <code>() => import('@/pages/...')</code> para code splitting.</li>
    </ul>
  </article>
</template>
