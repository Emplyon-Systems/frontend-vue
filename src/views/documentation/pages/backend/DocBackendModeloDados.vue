<template>
  <article class="doc-article">
    <h1>Modelo de dados — empresas, filiais, usuários, setores</h1>
    <p class="doc-lead">
      Hierarquia lógica: <strong>Company</strong> → várias <strong>Branch</strong> → vários
      <strong>Sector</strong> por filial. O <strong>User</strong> liga-se por tabelas pivot à
      empresa, à filial e ao setor, conforme o perfil e o acesso necessário.
    </p>

    <h2>Empresa (<code>companies</code>)</h2>
    <ul>
      <li>
        <code>hasMany</code> <strong>branches</strong> — cada filial tem <code>company_id</code>.
      </li>
      <li>
        <code>belongsToMany</code> <strong>users</strong> via <code>company_users</code>, com pivot
        <code>is_primary</code> para marcar empresa principal do usuário.
      </li>
    </ul>

    <h2>Filial (<code>branches</code>)</h2>
    <ul>
      <li><code>belongsTo</code> <strong>company</strong>.</li>
      <li>
        <code>hasMany</code> <strong>sectors</strong> — setor pertence a uma única filial
        (<code>sectors.branch_id</code>).
      </li>
      <li>
        <code>belongsToMany</code> <strong>users</strong> via <code>branch_users</code> (pivot
        <code>is_primary</code>).
      </li>
    </ul>

    <h2>Setor (<code>sectors</code>)</h2>
    <ul>
      <li><code>belongsTo</code> <strong>branch</strong>.</li>
      <li>
        Usuários podem ser associados a setores específicos via <code>user_sectors</code>
        (<code>belongsToMany</code> no <code>User</code>).
      </li>
    </ul>

    <h2>Usuário (<code>users</code>)</h2>
    <ul>
      <li>
        <strong>roles</strong> — <code>role_user</code>; permissões vêm dos roles e podem ser
        complementadas com <code>permission_user</code> (permissões diretas).
      </li>
      <li><strong>companies</strong> — <code>company_users</code>.</li>
      <li><strong>branches</strong> — <code>branch_users</code>.</li>
      <li><strong>sectors</strong> — <code>user_sectors</code>.</li>
    </ul>

    <h2>Limites de plano</h2>
    <p>
      A empresa pode expor <code>branch_limit</code> e <code>user_limit</code>; a contagem de
      usuários com acesso à empresa considera quem está vinculado à empresa <em>ou</em> a qualquer
      filial desta empresa (ver lógica em <code>Company::countUsersForLimit</code>).
    </p>

    <h2>Resumo visual</h2>
    <pre class="doc-pre"><code>Company 1 ──* Branch 1 ──* Sector A
         \        \──* Sector B
          \──* Branch 2 ──* Sector C

User *──* Company (company_users)
User *──* Branch  (branch_users)
User *──* Sector  (user_sectors)
User *──* Role    (role_user)</code></pre>
  </article>
</template>
