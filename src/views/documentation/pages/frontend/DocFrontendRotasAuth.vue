<template>
  <article class="doc-article">
    <h1>Rotas e autenticação</h1>
    <p class="doc-lead">
      Cada rota pode exigir sessão e capacidades específicas; o guard centraliza redirecionamentos.
    </p>

    <h2>Metadados úteis</h2>
    <ul>
      <li>
        <code>meta.authRequired</code> — redireciona para login se não houver token válido.
      </li>
      <li>
        <code>meta.permission</code> — slug(s) verificados com <code>auth.can('permission:slug')</code>
        (alinhado ao backend).
      </li>
      <li>
        <code>meta.role</code> / <code>meta.rolePrefix</code> — papéis ou prefixos (ex. perfis
        tenant por empresa/filial).
      </li>
      <li>
        <code>meta.panel</code> — por exemplo <code>owner</code> para restringir quem acede ao
        painel superadmin.
      </li>
    </ul>

    <h2>Contexto (empresa / filial)</h2>
    <p>
      Usuários com vários contextos passam por <code>/auth/select-context</code> até escolher
      empresa ou filial ativa; o store guarda o contexto para requisições e navegação.
    </p>

    <h2>Painéis por prefixo de URL</h2>
    <p>
      Exemplos: <code>/company/…</code> (empresa), <code>/branch/…</code> (filial),
      <code>/employee/…</code> (colaborador), raiz e <code>/companies/…</code> para fluxo owner.
      Muitas views são compartilhadas entre prefixos com o mesmo componente Vue.
    </p>
  </article>
</template>
