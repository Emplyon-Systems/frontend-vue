<template>
  <article class="doc-article">
    <h1>Padrão Policy (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> autorização <strong>por modelo</strong> —
      <code>viewAny</code>, <code>view</code>, <code>create</code>, <code>update</code>,
      <code>delete</code>, etc.
    </p>

    <p>
      <strong>Estado atual:</strong> muitos módulos ainda não têm Policy; a direção é migrar a lógica
      dos controllers para cá.
    </p>

    <h2>Exemplo esqueleto (alvo)</h2>
    <pre class="doc-pre"><code>&lt;?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('superadmin')
            || $user->hasRole('owner')
            || $user->hasPermissionTo('companies.index');
    }

    public function view(User $user, Company $company): bool
    {
        if ($user->hasRole('superadmin') || $user->hasRole('owner')) {
            return true;
        }
        // … combinar permissão com escopo (empresa permitida)
        return $user->hasPermissionTo('companies.read')
            && $user->companies()->whereKey($company->id)->exists();
    }

    public function update(User $user, Company $company): bool
    {
        // …
        return false;
    }
}</code></pre>

    <p>
      Registar em <code>AuthServiceProvider</code> / <code>AppServiceProvider</code>:
      <code>Gate::policy(Company::class, CompanyPolicy::class);</code>
    </p>
  </article>
</template>
