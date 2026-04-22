<template>
  <article class="doc-article">
    <h1>Padrão Service (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> toda a <strong>regra de negócio</strong> e orquestração —
      transações, e-mail, sync de relações, validações de domínio. Usa
      <code>ScopeService</code> para aplicar filtros permitidos ao usuário antes de chamar o
      Repository.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Injeta <code>{Resource}Repository</code> e <code>ScopeService</code> (e outros services se necessário).</li>
      <li>Métodos públicos: <code>list</code>, <code>read</code>, <code>create</code>, <code>update</code>, <code>delete</code>, <code>plucks</code>.</li>
      <li>
        Filtros multi-tenant: passar por
        <code>$this->scope->applyToFilters($filters, 'company'|'branch'|…)</code>.
      </li>
      <li>Lança <code>ValidationException</code> ou <code>ModelNotFoundException</code>; não retorna <code>JsonResponse</code>.</li>
    </ul>

    <h2>Exemplo esqueleto</h2>
    <pre class="doc-pre"><code>&lt;?php

namespace App\Services;

use App\Repositories\CompanyRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CompanyService
{
    public function __construct(
        protected CompanyRepository $companyRepository,
        protected ScopeService $scope
    ) {}

    public function plucks(): array
    {
        return $this->companyRepository->plucks(
            $this->scope->applyToFilters([], 'company')
        );
    }

    public function list(array $filters)
    {
        return $this->companyRepository->filter(
            $this->scope->applyToFilters($filters, 'company')
        );
    }

    public function create(array $data)
    {
        if (! $this->scope->isGlobal()) {
            throw new ModelNotFoundException('Company create not allowed for current user.');
        }
        // … regras, transação DB, e-mails, etc.
        return $this->companyRepository->create(/* … */);
    }
}</code></pre>
  </article>
</template>
