<template>
  <article class="doc-article">
    <h1>Autorização (backend)</h1>
    <p class="doc-lead">
      Papéis (<code>roles</code>) e permissões (<code>permissions</code>) na base de dados, ligados ao
      usuário; em cima disso, <strong>Policies</strong> por model e um
      <strong>Gate::before</strong> para atalhos <code>permission:</code> e <code>role:</code>.
    </p>

    <h2>Gate::before</h2>
    <p>
      Em <code>AppServiceProvider</code>, abilities <code>permission:slug</code> e
      <code>role:slug</code> delegam em <code>hasPermissionTo</code> / <code>hasRole</code> no model
      <code>User</code>. Útil para middleware em rotas sem modelo concreto, por exemplo
      <code>can:permission:audits.index</code> em <code>routes/api.php</code>.
    </p>

    <h2>Policies + controllers API</h2>
    <p>
      Para recursos CRUD (e variantes <code>plucks</code>), a decisão “pode ou não” está nas classes em
      <code>app/Policies</code>, registadas com <code>Gate::policy</code>. Os controllers usam
      <code>apiDenyUnless</code> / <code>apiAllows</code> do trait
      <code>AuthorizesApiResources</code> para obter 403 no formato JSON já padronizado
      (<code>ResponseHelper</code>).
    </p>
    <p>
      Documentação detalhada:
      <code>backend/docs/padroes/autorizacao-policy-gate.md</code> — menu
      <strong>Backend → Policies</strong> (visão / padrão / regras).
    </p>

    <h2>ScopeService</h2>
    <p>
      Complementa a autorização: define <strong>que IDs</strong> entram em listagens e leituras
      (empresas/filiais acessíveis). A policy responde “pode tentar a operação”; o service aplica o
      filtro de dados e asserts de escopo.
    </p>

    <h2>Testes</h2>
    <p>
      Cobertura via testes Feature HTTP:
      <router-link :to="{ name: 'documentation.backend.testes' }">Testes (API e front)</router-link>
      — e arquivo <code>backend/docs/padroes/testes-feature-api.md</code>.
    </p>
  </article>
</template>
