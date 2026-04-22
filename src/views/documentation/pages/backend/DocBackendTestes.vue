<template>
  <article class="doc-article">
    <h1>Testes — API e frontend</h1>
    <p class="doc-lead">
      A API Laravel é validada com <strong>PHPUnit</strong> em <code>tests/Feature/Api</code>. O frontend
      tem testes unitários com <strong>Vitest</strong> (helpers e smoke Vue).
    </p>

    <h2>Backend</h2>
    <pre class="doc-pre"><code>cd backend
php artisan test tests/Feature/Api</code></pre>
    <ul>
      <li>
        <code>tests/TestCase.php</code> — helpers: <code>actingAsSuperadmin()</code>,
        <code>actingAsRole()</code>, <code>validCompanyCreatePayload()</code>,
        <code>makeSuperadminUser()</code> (para tokens sem misturar com <code>actingAs</code>), etc.
      </li>
      <li>
        <code>tests/Concerns/SeedsRolePermissions.php</code> — use com
        <code>RefreshDatabase</code> para popular roles/permissões (<code>RolePermissionSeeder</code>).
      </li>
      <li>
        As <strong>policies</strong> não têm normalmente testes unitários isolados: o comportamento é
        coberto pelos pedidos HTTP (401, 403, CRUD com superadmin,
        <code>TenantHierarchyFlowTest</code>, …).
      </li>
    </ul>

    <h2>Frontend</h2>
    <pre class="doc-pre"><code>cd frontend
npm run test:run</code></pre>
    <ul>
      <li>Configuração: <code>vite.config.ts</code> (bloco <code>test</code>, ambiente <code>jsdom</code>).</li>
      <li>Exemplos: <code>src/helpers/__tests__/map-laravel-errors.spec.ts</code>,
        <code>src/test/vue-mount.smoke.spec.ts</code>.</li>
    </ul>

    <h2>Fonte em Markdown</h2>
    <p>
      Texto completo e tabelas:
      <code>backend/docs/padroes/testes-feature-api.md</code>
    </p>
  </article>
</template>
