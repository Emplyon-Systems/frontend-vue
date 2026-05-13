<template>
  <article class="doc-article">
    <h1>Views — regras</h1>
    <ul>
      <li>Não hardcodar URL da API — usar <code>@/api/resources</code> ou <code>http-client</code>.</li>
      <li>Feedback ao usuário: <code>notify</code>, modais de confirmação, estados de loading.</li>
      <li>Permissões: <code>useAuthStore().can(...)</code> coerente com slugs do backend.</li>
      <li>Componentes genéricos em <code>@/components/</code>; views focam no domínio.</li>
    </ul>
  </article>
</template>
