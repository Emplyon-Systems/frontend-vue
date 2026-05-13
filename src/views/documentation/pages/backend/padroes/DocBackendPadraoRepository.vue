<template>
  <article class="doc-article">
    <h1>Padrão Repository (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> acesso a dados — <code>filter</code> (paginação + critérios),
      <code>find</code>, <code>create</code>, <code>update</code>, <code>delete</code>,
      <code>plucks</code>. Sem <code>Auth</code>, sem permissões de produto.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>
        Implementar <code>App\Repositories\Interfaces\RepositoryInterface</code> via
        <code>{Resource}RepositoryInterface</code>.
      </li>
      <li>
        <code>filter(array $filters, ?Builder $query = null)</code> — o Service pode pré-restringir a
        query (escopo) sem duplicar ordenação/paginação.
      </li>
      <li>
        Pivots e <code>sync</code>: preferir no Service (model ou métodos explícitos no repository) —
        uma estratégia consistente por módulo.
      </li>
    </ul>

    <h2>Contrato base (referência)</h2>
    <p>
      <code>newObject</code>, <code>plucks</code>, <code>all</code>, <code>filter</code>,
      <code>create</code>, <code>find</code>, <code>update</code>, <code>delete</code>.
    </p>

    <p class="doc-callout">
      Ver também <code>backend/docs/padroes/repositorios.md</code> e o exemplo em
      <code>docs/padrao.back.md</code> no repositório.
    </p>
  </article>
</template>
