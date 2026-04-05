<template>
  <article class="doc-article">
    <h1>Padrão Observer (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> efeitos colaterais do ciclo Eloquent (<code>created</code>,
      <code>updated</code>, …) — notificações, logs, campos derivados quando devem correr em
      qualquer entrada (API, comando, seeder).
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Não substituir o fluxo principal do caso de uso (ex.: “criar empresa + owner” no Service).</li>
      <li>Registar: <code>{Model}::observe({Model}Observer::class);</code> no <code>AppServiceProvider</code>.</li>
    </ul>

    <h2>Exemplo esqueleto</h2>
    <pre class="doc-pre"><code>&lt;?php

namespace App\Observers;

use App\Models\Company;

class CompanyObserver
{
    public function created(Company $company): void
    {
        // ex.: job de indexação, log
    }
}</code></pre>
  </article>
</template>
