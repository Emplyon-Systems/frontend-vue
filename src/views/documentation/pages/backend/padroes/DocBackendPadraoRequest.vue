<template>
  <article class="doc-article">
    <h1>Padrão Form Request (backend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> regras de validação (<code>rules</code>) e, quando aplicável,
      <code>authorize()</code> delegando para a Policy.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Um request por recurso ou por operação (<code>StoreCompanyRequest</code> / <code>UpdateCompanyRequest</code> — nomes separados para create/update, opcional).</li>
      <li>Mensagens e atributos em português se o projeto assim o fixar (<code>attributes()</code>).</li>
    </ul>

    <h2>Exemplo esqueleto</h2>
    <pre class="doc-pre"><code>&lt;?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ou $this->user()->can('update', $this->route('company'));
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            // …
        ];
    }
}</code></pre>
  </article>
</template>
