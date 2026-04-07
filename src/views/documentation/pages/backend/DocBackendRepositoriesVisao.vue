<template>
  <article class="doc-article">
    <h1>Repositories — visão geral</h1>
    <p class="doc-lead">
      Camada de <strong>acesso a dados</strong> por agregado. O controller <strong>não</strong> usa
      repository — apenas o service.
    </p>

    <h2>Contrato base</h2>
    <p>
      <code>App\Repositories\Interfaces\RepositoryInterface</code> — operações comuns:
      <code>newObject</code>, <code>plucks</code>, <code>all</code>, <code>filter</code>,
      <code>create</code>, <code>find</code>, <code>update</code>, <code>delete</code>.
    </p>

    <h2>Por recurso</h2>
    <p>
      Interface específica com tipos Eloquent (ex.: <code>CompanyRepositoryInterface</code>) +
      implementação na mesma pasta.
    </p>

    <h2>O que não faz</h2>
    <ul>
      <li>Não chama <code>Auth::user()</code> nem decide permissões de produto.</li>
      <li>Não envia e-mails nem jobs.</li>
    </ul>
  </article>
</template>
