<template>
  <article class="doc-article">
    <h1>Observers — regras</h1>
    <ul>
      <li>Não colocar o fluxo principal de um caso de uso (ex.: criar empresa + owner + mail) só no observer.</li>
      <li>Evitar dependência de <code>request()</code> global.</li>
      <li>Cuidado com cadeias: observer que altera outro model que dispara outro observer.</li>
      <li>Operações que podem falhar e devem ser visíveis ao usuário preferem ficar no service com tratamento explícito.</li>
    </ul>
  </article>
</template>
