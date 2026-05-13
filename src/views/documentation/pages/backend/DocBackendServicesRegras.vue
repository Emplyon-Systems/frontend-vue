<template>
  <article class="doc-article">
    <h1>Services — regras</h1>
    <ul>
      <li>Injetar <strong>Repository</strong> do agregado e <strong>ScopeService</strong> quando o recurso for escopado.</li>
      <li>Passar sempre <code>$filters</code> de listagem pelo escopo antes do <code>repository->filter()</code>.</li>
      <li>Transações envolvendo várias escritas no banco de dados devem ficar no service (não no controller).</li>
      <li>Não retornar <code>JsonResponse</code> — apenas models, paginators, arrays ou primitivos.</li>
      <li>Side effects pesados (e-mail ao criar empresa) explícitos no fluxo do método, não escondidos.</li>
    </ul>
  </article>
</template>
