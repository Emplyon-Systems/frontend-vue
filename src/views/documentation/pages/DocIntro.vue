<template>
  <article class="doc-article">
    <h1>Documentação Emplyon</h1>
    <p class="doc-lead">
      Guia técnico do monorepo: convenções de backend (Laravel), estrutura do frontend (Vue 3) e
      como o domínio (empresas, filiais, usuários, setores) se relaciona com o banco de dados.
    </p>
    <p>
      Use o menu à esquerda: <strong>Backend</strong> e <strong>Frontend</strong> têm submenus
      por camada (Controllers, Services, … / Pages, Views, …) com <strong>Visão geral</strong>,
      <strong>Padrão</strong> e <strong>Regras</strong>. Cada página carrega só esse conteúdo.
    </p>

    <h2>Esqueleto de pastas (exemplo: Users)</h2>
    <p>
      Árvore resumida do mesmo domínio nos dois lados: API Laravel em <code>backend/</code> e SPA em
      <code>frontend/src/</code>. Serve só para orientar onde procurar arquivos; outros módulos
      (empresas, filiais, …) seguem o mesmo padrão de pastas.
    </p>

    <h3>Backend (Laravel)</h3>
    <p>
      Requisição HTTP → <code>routes/api.php</code> (prefixo <code>users</code>) → controller → service →
      repository → model.
    </p>
    <pre class="doc-pre" aria-label="Pastas backend Users">backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── UsersController.php
│   │   └── Requests/
│   │       └── UserRequest.php
│   ├── Models/
│   │   └── User.php
│   ├── Repositories/
│   │   └── UserRepository.php
│   └── Services/
│       └── UserService.php
├── routes/
│   └── api.php          # prefixo users → UsersController
└── database/
    └── migrations/      # ex.: create_users_table…</pre>

    <h3>Frontend (Vue 3)</h3>
    <p>
      Rota em <code>router/routes.ts</code> → <strong>page</strong> (layout) → <strong>view</strong>
      (UI) → <code>api/resources/users.ts</code> (HTTP).
    </p>
    <pre class="doc-pre" aria-label="Pastas frontend Users">frontend/src/
├── api/
│   └── resources/
│       └── users.ts
├── pages/
│   └── panels/
│       └── owner/
│           └── users/
│               ├── index.vue
│               ├── create.vue
│               ├── edit.vue
│               └── view.vue
├── router/
│   └── routes.ts        # /users, /users/create, /users/:id…
└── views/
    └── panels/
        └── owner/
            └── users/
                ├── View.vue
                ├── Filter.vue
                ├── form/
                │   └── DataForm.vue
                └── profile/
                    ├── index.vue
                    └── …</pre>

    <h2>Por onde começar</h2>
    <ul>
      <li>
        <router-link :to="{ name: 'documentation.backend.architecture' }">Arquitetura backend</router-link>
        — fluxo, checklist de arquivos e o vínculo com o
        <router-link :to="{ name: 'documentation.backend.moduloCompleto' }">módulo completo (Company)</router-link>.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.frontend.architecture' }">Arquitetura frontend</router-link>
        — fluxo Page → View → API e
        <router-link :to="{ name: 'documentation.frontend.moduloCompleto' }">módulo completo (companies)</router-link>.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.backend.index' }">Backend — índice</router-link>
        — lista de todas as seções.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.frontend.index' }">Frontend — índice</router-link>.
      </li>
      <li>
        <router-link :to="{ name: 'documentation.markdown' }">Fonte em Markdown</router-link>
        — arquivos no repositório (<code>docs/</code>, <code>backend/docs/padroes/</code>).
      </li>
    </ul>
  </article>
</template>
