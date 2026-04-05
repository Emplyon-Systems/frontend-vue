<template>
  <article class="doc-article">
    <h1>Fonte em Markdown</h1>
    <p class="doc-lead">
      A documentação “oficial”, em evolução contínua, fica no repositório em Markdown, para revisão por PR e
      diff claro.
    </p>
    <p>Caminhos na <strong>raiz do monorepo</strong> (pasta <code>docs/</code>):</p>
    <ul>
      <li><code>docs/padroes-backend-modulo.md</code> — padrão Controller, Service, Repository, …</li>
      <li><code>docs/padroes-frontend-modulo.md</code> — padrão Page, View, rota, API</li>
      <li><code>docs/README.md</code> — índice geral</li>
    </ul>
    <p>Caminhos relativos à pasta <code>backend/</code>:</p>
    <ul>
      <li><code>docs/padroes/README.md</code> — índice dos padrões</li>
      <li><code>docs/padroes/camadas-controller-service.md</code> — controller, service, fluxo</li>
      <li><code>docs/padroes/repositorios.md</code> — padrão repository</li>
      <li><code>docs/padroes/autorizacao-policy-gate.md</code> — policies e gates</li>
      <li><code>docs/padroes/observers-efeitos-colaterais.md</code> — observers</li>
    </ul>
    <div class="doc-callout">
      Neste site, cada camada (Controllers, Services, …) tem <strong>Visão</strong>,
      <strong>Padrão</strong> e <strong>Regras</strong>, alinhadas a esses Markdown. Em caso de
      divergência, atualize primeiro o <code>.md</code> e depois as vistas em
      <code>frontend/src/views/documentation/</code>.
    </div>
  </article>
</template>
