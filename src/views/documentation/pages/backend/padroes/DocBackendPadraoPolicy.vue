<template>
  <article class="doc-article">
    <h1>Padrão Policy (backend)</h1>
    <p class="doc-lead">
      Uma policy por model exposto na API; métodos espelham as abilities do <code>Gate</code>
      (<code>viewAny</code>, <code>view</code>, <code>create</code>, …) e métodos extra quando preciso
      (<code>plucks</code>, <code>syncPermissions</code>).
    </p>

    <h2>Trait partilhado</h2>
    <p>
      Arquivo: <code>app/Policies/Concerns/ChecksTenantPermissions.php</code>. Exemplo de uso no corpo
      da policy:
    </p>
    <pre class="doc-pre"><code>use App\Policies\Concerns\ChecksTenantPermissions;

class CompanyPolicy
{
    use ChecksTenantPermissions;

    public function viewAny(User $auth): bool
    {
        return $this-&gt;allowsWithGlobal($auth, 'companies.index');
    }

    public function view(User $auth, Company $company): bool
    {
        return $this-&gt;allowsWithGlobal($auth, 'companies.read');
    }
}</code></pre>

    <h2>Exceção: usuário a si próprio</h2>
    <p>
      Em <code>UserPolicy</code>, <code>view</code> e <code>update</code> devolvem
      <code>true</code> quando <code>$auth-&gt;id === $target-&gt;id</code>, sem exigir
      <code>users.read</code> / <code>users.update</code>. O filtro de campos no update do próprio perfil
      continua no <code>UsersController</code>.
    </p>

    <h2>Controller</h2>
    <p>Arquivo base: <code>app/Http/Controllers/Concerns/AuthorizesApiResources.php</code>.</p>
    <pre class="doc-pre"><code>// Listagem
if ($r = $this-&gt;apiDenyUnless('list', 'viewAny', Company::class)) {
    return $r;
}

// Leitura após findOrFail
if ($r = $this-&gt;apiDenyUnless('read', 'view', $company)) {
    return $r;
}</code></pre>

    <h2>Referência completa</h2>
    <p>
      <code>backend/docs/padroes/autorizacao-policy-gate.md</code> — registro das policies, tabela por
      model, <code>Gate::before</code> e relação com <code>ScopeService</code>.
    </p>
  </article>
</template>
