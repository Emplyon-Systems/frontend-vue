<template>
  <article class="doc-article">
    <h1>Módulo completo — exemplo <code>Company</code></h1>
    <p class="doc-lead">
      O recurso <strong>Empresa</strong> no repositório real conecta todas as partes: rota, controller,
      request, service, repository e model. Abaixo: papel de cada arquivo e trechos ilustrativos (o
      código completo está em <code>backend/</code>).
    </p>

    <h2>1. Rotas</h2>
    <p><code>routes/api.php</code> — grupo <code>companies</code> com <code>auth:sanctum</code>:</p>
    <pre class="doc-pre" v-pre><code>Route::prefix('companies')
    ->controller(CompaniesController::class)
    ->group(function () {
        Route::get('/', 'list');
        Route::post('/', 'list');
        Route::post('create', 'create');
        Route::get('{id}', 'read');
        // … update, delete, plucks
    });</code></pre>

    <h2>2. Controller — <code>CompaniesController.php</code></h2>
    <p>
      Injeta <code>CompanyService</code>. Em <code>list</code>: verifica
      <code>companies.index</code>, chama <code>$this->companyService->list($request->all())</code>,
      envolve em <code>ResponseHelper::success</code>.
    </p>

    <h2>3. Form Request — <code>CompanyRequest.php</code></h2>
    <p>
      <code>rules()</code> distingue POST (create) com campos da empresa + <code>user_*</code> para o
      owner inicial, e PUT/PATCH (update) com <code>sometimes</code> e <code>Rule::unique</code> com
      <code>ignore($companyId)</code>.
    </p>

    <h2>4. Service — <code>CompanyService.php</code></h2>
    <p>
      Injeta <code>CompanyRepository</code> e <code>ScopeService</code>. <code>list</code> e
      <code>plucks</code> passam filtros por <code>$this->scope->applyToFilters($filters, 'company')</code>.
      <code>create</code> exige <code>$this->scope->isGlobal()</code>, abre transação: cria empresa,
      cria usuário owner, associa role <code>empresa</code>, sync em <code>company_users</code>,
      envia e-mail de credenciais.
    </p>
    <pre class="doc-pre" v-pre><code>public function list(array $filters)
{
    return $this->companyRepository->filter(
        $this->scope->applyToFilters($filters, 'company')
    );
}</code></pre>

    <h2>5. Repository — <code>CompanyRepository.php</code></h2>
    <p>
      Implementa <code>CompanyRepositoryInterface</code>. <code>filter</code> aplica
      <code>search</code>, <code>company_ids</code>, ordenação e <code>paginate</code>.
      <code>create</code>/<code>update</code> chamam <code>syncRelationships</code> no model quando
      aplicável.
    </p>

    <h2>6. Model — <code>Company.php</code></h2>
    <p>
      Relações <code>users()</code> (pivot <code>company_users</code>), <code>branches()</code>,
      atributos calculados <code>branches_used</code> / <code>users_used</code> para limites de
      plano.
    </p>

    <h2>Mapa rápido</h2>
    <div class="doc-table-wrap">
      <table class="doc-table">
        <thead>
          <tr>
            <th>Arquivo</th>
            <th>Função neste módulo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>CompaniesController</code></td>
            <td>Permissões HTTP + delegação ao service</td>
          </tr>
          <tr>
            <td><code>CompanyRequest</code></td>
            <td>Validação create/update</td>
          </tr>
          <tr>
            <td><code>CompanyService</code></td>
            <td>Escopo, transações, owner, e-mail</td>
          </tr>
          <tr>
            <td><code>CompanyRepository</code></td>
            <td>Queries e CRUD na tabela <code>companies</code></td>
          </tr>
          <tr>
            <td><code>Company</code></td>
            <td>Relações e soft deletes</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="doc-callout">
      Para outro recurso (ex.: <code>Branch</code>, <code>Sector</code>), replique o mesmo conjunto
      de arquivos e mantenha o fluxo Controller → Service → Repository.
    </p>
  </article>
</template>
