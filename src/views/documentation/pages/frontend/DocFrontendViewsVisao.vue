<template>
  <article class="doc-article">
    <h1>Views — visão geral</h1>
    <p class="doc-lead">
      Em <code>src/views/panels/...</code> — telas e partes reutilizáveis: formulários, filtros,
      tabs de perfil, dashboards.
    </p>
    <ul>
      <li>Mesma view pode servir rotas <code>/company/...</code> e <code>/owner/...</code> quando o produto reutiliza a tela.</li>
      <li>Concentram estado local, validação e chamadas <code>*Api</code>.</li>
    </ul>
  </article>
</template>
