<template>
  <article class="doc-article">
    <h1>Controllers — visão geral</h1>
    <p class="doc-lead">
      A classe <code>*Controller</code> em <code>App\Http\Controllers\Api</code> é o único ponto
      que fala HTTP (JSON, status codes) para aquele recurso.
    </p>
    <ul>
      <li>Recebe dados já validados pelo <strong>Form Request</strong>.</li>
      <li>
        Garante que o usuário pode executar a ação (hoje <code>hasPermission</code> / papéis
        globais; <strong>alvo:</strong> Policy).
      </li>
      <li>Chama <strong>um</strong> método do <strong>Service</strong> por ação da API.</li>
      <li>Retorna resposta com <code>ResponseHelper</code> (success, error, forbidden, notFound).</li>
    </ul>
    <p>
      Não é responsabilidade do controller aplicar escopo de empresa/filial, montar queries nem
      enviar e-mails — isso fica no service.
    </p>
  </article>
</template>
