<template>
  <article class="doc-article">
    <h1>Pages — regras</h1>
    <ul>
      <li>Ordem SFC: <code>script setup</code> → <code>template</code> → <code>style</code>.</li>
      <li>Um único <code>script setup</code> e um <code>template</code> por arquivo.</li>
      <li>Importar layouts de <code>@/layouts/</code>; não duplicar markup de casca entre pages — usar o mesmo layout.</li>
      <li>Evitar chamadas excessivas à API na page se a view já as encapsula — evitar duplicação.</li>
    </ul>
  </article>
</template>
