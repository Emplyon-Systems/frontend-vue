<template>
  <article class="doc-article">
    <h1>Form Requests — regras</h1>
    <ul>
      <li><code>rules()</code> completas para create/update; usar <code>Rule::unique</code> com <code>ignore</code> em updates.</li>
      <li><code>authorize()</code> pode retornar <code>true</code> temporariamente ou delegar para a Policy.</li>
      <li>Alinhar nomes de campos ao contrato JSON que o frontend envia.</li>
      <li>Evitar lógica de negócio pesada — apenas validação de formato, obrigatoriedade e unicidade no banco de dados.</li>
    </ul>
  </article>
</template>
