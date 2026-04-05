<template>
  <article class="doc-article">
    <h1>Autorização (backend)</h1>
    <p class="doc-lead">
      Papéis (<code>roles</code>) e permissões (<code>permissions</code>) no banco de dados, vinculados
      ao usuário via tabelas pivô.
    </p>

    <h2>Gate::before</h2>
    <p>
      Em <code>AppServiceProvider</code>, abilities no formato <code>permission:slug</code> e
      <code>role:slug</code> delegam para <code>hasPermissionTo</code> / <code>hasRole</code> no
      model <code>User</code>.
    </p>

    <h2>Rotas</h2>
    <p>
      Exemplo: <code>middleware('can:permission:audits.index')</code> em
      <code>routes/api.php</code>. Para decisões que dependem do registro específico (ex.: “pode editar
      esta empresa?”), o alvo é <strong>Policy</strong> por modelo.
    </p>

    <h2>ScopeService</h2>
    <p>
      Complementa a autorização: define <strong>que IDs</strong> entram em listagens e leituras
      (empresas/filiais acessíveis). Policy responde “pode tentar a operação”; o service aplica o
      filtro de dados.
    </p>
  </article>
</template>
