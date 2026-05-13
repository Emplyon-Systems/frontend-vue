<template>
  <article class="doc-article">
    <h1>Arquitetura — Backend</h1>
    <p class="doc-lead">
      Visão em camadas da API Laravel: cada requisição HTTP atravessa validação, autorização no
      controller, regra de negócio no service, dados no repository.
    </p>

    <h2>Fluxo</h2>
    <pre class="doc-pre" v-pre><code>HTTP → Form Request (validação)
     → Controller (auth + chama 1 método do Service)
     → Service (ScopeService + regras + orquestração)
     → Repository (queries / CRUD)
     → Model / banco de dados</code></pre>

    <h2>Checklist — arquivos por módulo</h2>
    <p>Para um recurso <code>{Resource}</code> (singular no model):</p>
    <div class="doc-table-wrap">
      <table class="doc-table">
        <thead>
          <tr>
            <th>Parte</th>
            <th>Caminho típico</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rotas</td>
            <td><code>routes/api.php</code></td>
          </tr>
          <tr>
            <td>Controller</td>
            <td><code>app/Http/Controllers/Api/{Resources}Controller.php</code></td>
          </tr>
          <tr>
            <td>Form Request</td>
            <td><code>app/Http/Requests/{Resource}Request.php</code></td>
          </tr>
          <tr>
            <td>Service</td>
            <td><code>app/Services/{Resource}Service.php</code></td>
          </tr>
          <tr>
            <td>Repository</td>
            <td><code>app/Repositories/{Resource}Repository.php</code> + interface</td>
          </tr>
          <tr>
            <td>Model</td>
            <td><code>app/Models/{Resource}.php</code></td>
          </tr>
          <tr>
            <td>Migrations</td>
            <td><code>database/migrations/</code></td>
          </tr>
          <tr>
            <td>Policy</td>
            <td><code>app/Policies/{Resource}Policy.php</code> (alvo)</td>
          </tr>
          <tr>
            <td>Observer</td>
            <td><code>app/Observers/{Resource}Observer.php</code> (opcional)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      No menu <strong>Backend</strong>, cada camada (Controllers, Services, …) tem submenu:
      <strong>Visão geral</strong>, <strong>Padrão</strong> (código de referência) e
      <strong>Regras</strong> (checklist do que pode / não pode).
    </p>
    <p>
      Para ver tudo integrado num único caso real, abra
      <router-link :to="{ name: 'documentation.backend.moduloCompleto' }">Módulo completo (exemplo)</router-link
      >.
    </p>
  </article>
</template>
