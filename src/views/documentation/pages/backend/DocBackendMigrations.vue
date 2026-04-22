<template>
  <article class="doc-article">
    <h1>Migrations e banco de dados</h1>
    <p class="doc-lead">
      O schema evolui com arquivos em <code>backend/database/migrations/</code>, com data no nome
      para ordenação cronológica.
    </p>

    <h2>Organização</h2>
    <ul>
      <li>
        <strong>Tabelas principais:</strong> <code>users</code>, <code>companies</code>,
        <code>branches</code>, <code>sectors</code>, <code>shifts</code>, tipos de modalidade/escala,
        roles, permissions, audits, etc.
      </li>
      <li>
        <strong>Pivots (N:N):</strong> vínculos explícitos — ex. <code>company_users</code>,
        <code>branch_users</code>, <code>user_sectors</code>, <code>role_user</code>,
        <code>permission_role</code>, <code>permission_user</code>.
      </li>
      <li>
        Alterações incrementais (novas colunas, índices) entram em <strong>novas</strong> migrations;
        evita editar migrations já aplicadas em ambientes compartilhados.
      </li>
    </ul>

    <h2>Soft deletes e auditoria</h2>
    <p>
      Vários models usam <code>SoftDeletes</code>; a tabela <code>users</code> e outras podem ter
      campos de auditoria conforme migrations dedicadas.
    </p>

    <h2>Seeders</h2>
    <p>
      Dados iniciais em <code>database/seeders/</code> (perfis, permissões, usuários de demo).
      Não substituem migrations.
    </p>
  </article>
</template>
