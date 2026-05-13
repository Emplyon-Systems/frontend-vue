<template>
  <article class="doc-article">
    <h1>Repositories — regras</h1>
    <ul>
      <li>Implementar o contrato base e tipar retornos (<code>?Company</code>, paginator, etc.).</li>
      <li>
        <code>filter($filters, ?Builder $query)</code> — aceitar query pré-restringida pelo service
        (escopo) sem duplicar regras de ordenação/paginação.
      </li>
      <li>Sanitizar apenas dados <em>técnicos</em> de query (ex.: dígitos de CNPJ na cláusula where).</li>
      <li>Manter <code>plucks</code> leves (colunas necessárias para selects).</li>
      <li>Sincronização de pivôs: acordar se fica no model (<code>syncRelationships</code>), no service ou em método dedicado do repository — um padrão por módulo.</li>
    </ul>
  </article>
</template>
