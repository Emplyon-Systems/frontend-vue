<template>
  <article class="doc-article">
    <h1>Policies — visão geral</h1>
    <p class="doc-lead">
      Classes em <code>App\Policies</code> que respondem se o utilizador autenticado pode executar uma
      <strong>ability</strong> sobre um modelo (ou sobre a classe, em listagens / create).
    </p>

    <h2>Como está no projeto</h2>
    <ul>
      <li>
        <strong>Trait</strong> <code>App\Policies\Concerns\ChecksTenantPermissions</code> — define
        <code>isGlobalAccess</code> (superadmin / owner) e <code>allowsWithGlobal($auth, $slug)</code>
        para não repetir a mesma lógica em cada policy.
      </li>
      <li>
        Policies por model: <code>User</code>, <code>Company</code>, <code>Branch</code>,
        <code>Sector</code>, <code>Shift</code>, <code>Role</code> (inclui <code>syncPermissions</code>),
        <code>Permission</code>, <code>ModalityType</code>, <code>ScaleType</code>.
      </li>
      <li>
        Registo em <code>AppServiceProvider::boot()</code> com
        <code>Gate::policy(Model::class, XxxPolicy::class)</code>.
      </li>
      <li>
        Os controllers API usam o trait <code>App\Http\Controllers\Concerns\AuthorizesApiResources</code>
        (via <code>Controller</code> base) e chamadas do tipo
        <code>apiDenyUnless('read', 'view', $model)</code> para devolver 403 no formato
        <code>ResponseHelper</code> já usado pela API.
      </li>
    </ul>

    <h2>Documentação no repositório</h2>
    <p>
      Texto completo, tabelas e relação com <code>ScopeService</code>:
      <code>backend/docs/padroes/autorizacao-policy-gate.md</code>
    </p>
  </article>
</template>
