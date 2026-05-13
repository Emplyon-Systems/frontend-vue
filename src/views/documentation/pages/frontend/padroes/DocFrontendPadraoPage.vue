<template>
  <article class="doc-article">
    <h1>Padrão Page (frontend)</h1>
    <p class="doc-lead">
      <strong>Responsabilidade:</strong> entrada de rota — compor layout + view; manter o arquivo
      <strong>fino</strong> se a view já tiver a lógica.
    </p>

    <h2>Regras</h2>
    <ul>
      <li>Ordem SFC: <code>&lt;script setup&gt;</code> → <code>&lt;template&gt;</code> → <code>&lt;style&gt;</code>.</li>
      <li>Importar o layout adequado (<code>DefaultLayout</code>, <code>CompanyWorkspaceLayout</code>, …) e a view do domínio.</li>
    </ul>

    <h2>Exemplo</h2>
    <pre class="doc-pre" v-pre><code>&lt;script setup lang="ts"&gt;
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import FeatureIndex from "@/views/panels/owner/feature/Index.vue";
&lt;/script&gt;

&lt;template&gt;
  &lt;DefaultLayout&gt;
    &lt;FeatureIndex /&gt;
  &lt;/DefaultLayout&gt;
&lt;/template&gt;</code></pre>
  </article>
</template>
