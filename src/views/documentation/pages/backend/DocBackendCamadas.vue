<template>
  <article class="doc-article">
    <h1>Camadas e fluxo (backend)</h1>
    <p class="doc-lead">
      Princípio: o controller trata de HTTP; a regra de negócio vive no service; o acesso a dados
      no repository; o escopo no <code>ScopeService</code>.
    </p>

    <h2>Controller</h2>
    <p>
      Validação (Form Request), autorização (Policy/Gate ou transição a partir de código legado),
      chamada a <strong>um</strong> método do service por ação, resposta JSON via
      <code>ResponseHelper</code>. Sem queries complexas nem regra de domínio duplicada.
    </p>

    <h2>Service</h2>
    <p>
      Orquestra casos de uso, usa <code>ScopeService</code> para determinar que empresas, filiais
      ou registros o usuário pode ver, e chama repositories. Pode lançar
      <code>ValidationException</code> ou <code>ModelNotFoundException</code>.
    </p>

    <h2>Repository</h2>
    <p>
      Interface por agregado (ex.: <code>UserRepositoryInterface</code> + <code>UserRepository</code>).
      Métodos como <code>filter</code>, <code>find</code>, <code>create</code>, <code>update</code>,
      <code>delete</code>, <code>plucks</code>. Recebe filtros já alinhados ao escopo definido pelo
      service.
    </p>

    <h2>Policy (alvo)</h2>
    <p>
      Centralizar “pode ver/editar este modelo?” — por exemplo perfil próprio vs. permissão
      <code>users.read</code>. Parte do código ainda está nos controllers; a direção é migrar para
      <code>UserPolicy</code>, <code>CompanyPolicy</code>, etc.
    </p>

    <h2>Observer</h2>
    <p>
      Efeitos colaterais do ciclo Eloquent (notificações, campos derivados), não o fluxo principal
      transacional do caso de uso.
    </p>

    <h2>Fluxo típico</h2>
    <pre class="doc-pre"><code>Requisição → Form Request → Controller → Service → Repository → Model
                ← JSON ← Controller ← Service ←</code></pre>
  </article>
</template>
