<template>
  <article class="doc-article">
    <h1>Padrão Controller (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> HTTP apenas — validação no Form Request, autorização (hoje
      muitas vezes <code>hasPermission</code> + <code>isGlobalAccess</code>; <strong>alvo:</strong>
      Policy), delegação a <strong>um</strong> método do Service por ação, resposta via
      <code>ResponseHelper</code>.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Injeta só o <code>{Resource}Service</code> no construtor (não injetar Repository).</li>
      <li>Métodos espelham a API: <code>list</code>, <code>read</code>, <code>create</code>, <code>update</code>, <code>delete</code>, <code>plucks</code>.</li>
      <li>Trata <code>ModelNotFoundException</code> / <code>ValidationException</code> (404 / 422).</li>
      <li>Sem queries Eloquent nem regra de negócio (escopo, limites, e-mails).</li>
    </ul>

    <h2>Exemplo esqueleto</h2>
    <pre class="doc-pre"><code>&lt;?php

namespace App\Http\Controllers\Api;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyRequest;
use App\Models\User;
use App\Services\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CompaniesController extends Controller
{
    public function __construct(
        protected CompanyService $companyService
    ) {}

    protected function currentUser(): ?User
    {
        $user = Auth::user();
        return $user instanceof User ? $user : null;
    }

    protected function isGlobalAccess(?User $user): bool
    {
        if (! $user) {
            return false;
        }
        return $user->hasRole('superadmin') || $user->hasRole('owner');
    }

    protected function hasPermission(?User $user, string $permissionSlug): bool
    {
        if (! $user) {
            return false;
        }
        if ($this->isGlobalAccess($user)) {
            return true;
        }
        return $user->hasPermissionTo($permissionSlug);
    }

    public function list(CompanyRequest $request): JsonResponse
    {
        $user = $this->currentUser();
        if (! $this->hasPermission($user, 'companies.index')) {
            return ResponseHelper::forbidden('list', ['errors' => ['permission' => ['Forbidden']]]);
        }

        try {
            $companies = $this->companyService->list($request->all());
            return ResponseHelper::success('list', [
                'request' => $request->all(),
                'companies' => $companies,
            ]);
        } catch (\Exception $e) {
            return ResponseHelper::error('list', [
                'request' => $request->all(),
                'errors' => $e->getMessage(),
            ]);
        }
    }
}</code></pre>

    <p class="doc-callout">
      <strong>Evolução:</strong> substituir blocos <code>hasPermission</code> repetidos por
      <code>$this->authorize()</code> com <code>{Resource}Policy</code> quando a policy estiver
      registada.
    </p>
  </article>
</template>
