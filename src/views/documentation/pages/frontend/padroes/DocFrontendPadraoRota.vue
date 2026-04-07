<template>
  <article class="doc-article">
    <h1>Padrão rota — <code>routes.ts</code></h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> declarar path, nome e metadados para o guard em
      <code>router/index.ts</code>.
    </p>

    <h2>Campos úteis em <code>meta</code></h2>
    <ul>
      <li><code>authRequired</code> — exige sessão.</li>
      <li><code>permission</code> — slug(s) verificados no guard.</li>
      <li><code>role</code> / <code>rolePrefix</code> — papéis permitidos.</li>
      <li><code>panel</code> — restrição ao painel owner, quando aplicável.</li>
    </ul>

    <h2>Exemplo</h2>
    <pre class="doc-pre" v-pre><code>{
  path: "/recurso",
  name: "owner.recurso",
  meta: {
    title: setTitle("Recurso"),
    authRequired: true,
    permission: ["recurso.index", "recurso.read"],
  },
  component: () => import("@/pages/panels/owner/recurso/index.vue"),
}</code></pre>
  </article>
</template>
