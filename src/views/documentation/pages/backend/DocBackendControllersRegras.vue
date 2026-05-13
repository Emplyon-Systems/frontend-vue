<template>
  <article class="doc-article">
    <h1>Controllers — regras</h1>
    <ul>
      <li>Injetar no construtor apenas o <strong>Service</strong> do recurso (não Repository).</li>
      <li>Um método público por operação exposta na rota (<code>list</code>, <code>read</code>, <code>create</code>, …).</li>
      <li>Tratar <code>ModelNotFoundException</code> e <code>ValidationException</code> com o helper adequado.</li>
      <li>Não usar <code>User::query()</code>, <code>DB::</code> nem lógica de negócio condicional complexa.</li>
      <li>Evitar duplicar o mesmo bloco de permissão em dezenas de métodos — extrair trait ou migrar para Policy.</li>
      <li>Manter respostas JSON consistentes com o resto da API (<code>ResponseHelper</code>).</li>
    </ul>
  </article>
</template>
