<template>
  <article class="doc-article">
    <h1>Policies — regras</h1>
    <ul>
      <li>Uma policy principal por model de domínio exposto na API.</li>
      <li>Não substituir <code>ScopeService</code> nas listagens — policy autoriza a ação; o service ainda filtra IDs.</li>
      <li>Métodos puros em relação a HTTP — apenas <code>User</code> + model(s) + eventualmente dados já carregados.</li>
      <li>Testar cenários: superadmin, owner, tenant com e sem vínculo ao registro.</li>
    </ul>
  </article>
</template>
