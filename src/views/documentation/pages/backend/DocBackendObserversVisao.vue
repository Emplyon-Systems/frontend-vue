<template>
  <article class="doc-article">
    <h1>Observers — visão geral</h1>
    <p class="doc-lead">
      Reagem a eventos do ciclo de vida Eloquent (<code>creating</code>, <code>created</code>,
      <code>updated</code>, …) do model.
    </p>
    <ul>
      <li>Úteis para efeitos que devem ocorrer em <strong>qualquer</strong> origem de escrita (API, comando, seeder controlado).</li>
      <li>Registados em <code>AppServiceProvider</code> com <code>Model::observe(Observer::class)</code>.</li>
    </ul>
  </article>
</template>
