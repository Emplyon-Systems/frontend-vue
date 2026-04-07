<template>
  <article class="doc-article">
    <h1>Services — visão geral</h1>
    <p class="doc-lead">
      O <code>*Service</code> concentra a <strong>regra de negócio</strong> e a orquestração: chama
      um ou mais repositories, models, mail, filas, transações <code>DB::transaction</code>.
    </p>
    <ul>
      <li>
        Usa <code>ScopeService</code> para aplicar filtros ao usuário atual (<code>applyToFilters</code>,
        <code>isGlobal</code>) antes de listagens e leituras multi-tenant.
      </li>
      <li>Recebe arrays ou dados já validados — não depende de <code>Request</code> diretamente.</li>
      <li>Lança exceções semânticas; o controller traduz em HTTP.</li>
    </ul>
  </article>
</template>
