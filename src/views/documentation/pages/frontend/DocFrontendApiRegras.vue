<template>
  <article class="doc-article">
    <h1>API (cliente) — regras</h1>
    <ul>
      <li>Não expor URL absoluta do backend no código — proxy / mesma origem em dev.</li>
      <li>Token: confiar no interceptor do <code>http-client</code> + store de auth.</li>
      <li>Tratar erros 403/422 de forma consistente (toast ou redirect) nas views que chamam a API.</li>
      <li>Evitar duplicar o mesmo endpoint em vários arquivos — centralizar no resource module.</li>
    </ul>
  </article>
</template>
