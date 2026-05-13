<template>
  <article class="doc-article">
    <h1>Padrão View (frontend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> listagem, filtros, formulário, chamadas à API, feedback
      (toast / alert).
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Sem URL hardcoded da API — <code>@/helpers/http-client</code> ou módulos <code>api/</code>.</li>
      <li>Validação com a stack do projeto (Vuelidate / Zod).</li>
      <li><code>can('permission:slug')</code> para esconder ações quando necessário (alinhado ao backend).</li>
    </ul>
  </article>
</template>
