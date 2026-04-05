<template>
  <article class="doc-article">
    <h1>Policies — visão geral</h1>
    <p class="doc-lead">
      Classes em <code>App\Policies</code> que respondem “este usuário pode executar esta ação
      sobre <em>este</em> modelo?”.
    </p>
    <ul>
      <li>Métodos típicos: <code>viewAny</code>, <code>view</code>, <code>create</code>, <code>update</code>, <code>delete</code>.</li>
      <li>Complementam permissões por slug: combinam papel, permissão e vínculo (ex.: empresa do usuário).</li>
      <li>Registar com <code>Gate::policy(Model::class, ModelPolicy::class)</code>.</li>
    </ul>
    <p>
      <strong>Estado do projeto:</strong> parte da autorização ainda está nos controllers; a direção é
      consolidar aqui.
    </p>
  </article>
</template>
