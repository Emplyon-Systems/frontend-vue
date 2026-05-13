<template>
  <article class="doc-article">
    <h1>Form Requests — visão geral</h1>
    <p class="doc-lead">
      Classes em <code>App\Http\Requests</code> que estendem <code>FormRequest</code> (ou a base do
      projeto) para centralizar <code>rules()</code> e opcionalmente <code>authorize()</code>.
    </p>
    <ul>
      <li>Separam a validação do controller — o controller assume input válido após passar o request.</li>
      <li>Podem variar regras por método HTTP ou por “ação” (create vs update), como em <code>CompanyRequest</code>.</li>
    </ul>
  </article>
</template>
