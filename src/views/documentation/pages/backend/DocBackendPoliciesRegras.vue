<template>
  <article class="doc-article">
    <h1>Policies — regras</h1>
    <ul>
      <li>
        <strong>Uma policy principal</strong> por model de domínio exposto na API (alinhada ao registo
        <code>Gate::policy</code>).
      </li>
      <li>
        <strong>Não duplicar</strong> a condição superadmin/owner em cada método: usar
        <code>ChecksTenantPermissions::allowsWithGlobal</code>.
      </li>
      <li>
        <strong>Não substituir o <code>ScopeService</code></strong> nas listagens — a policy autoriza a
        ação; o service continua a filtrar IDs e a fazer <code>assertUserInScope</code> / branch permitida
        onde aplicável.
      </li>
      <li>
        Métodos <strong>puros em relação a HTTP</strong> — apenas <code>User</code>, model(s) e dados já
        carregados; sem <code>Request</code> dentro da policy.
      </li>
      <li>
        <strong>Validação</strong> (formato, unique, regras de negócio de persistência) fica em Form
        Request e Service, não na policy.
      </li>
      <li>
        <strong>Testes</strong> — alterações em policies devem manter verde
        <code>php artisan test tests/Feature/Api</code>; ver
        <code>backend/docs/padroes/testes-feature-api.md</code> e a página
        <router-link :to="{ name: 'documentation.backend.testes' }">Testes (API e front)</router-link>.
      </li>
    </ul>
  </article>
</template>
