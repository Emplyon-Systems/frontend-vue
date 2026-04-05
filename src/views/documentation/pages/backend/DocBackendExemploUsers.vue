<template>
  <article class="doc-article">
    <h1>Exemplo: módulo Users (arquivos)</h1>
    <p class="doc-lead">
      Mapa de referência para replicar o padrão em outros recursos (Companies, Branches, …).
    </p>

    <div class="doc-table-wrap">
      <table class="doc-table">
        <thead>
          <tr>
            <th>Camada</th>
            <th>Caminho (a partir de <code>backend/</code>)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rotas</td>
            <td><code>routes/api.php</code> — grupo <code>users</code>; login em <code>AuthController</code></td>
          </tr>
          <tr>
            <td>Controller CRUD</td>
            <td><code>app/Http/Controllers/Api/UsersController.php</code></td>
          </tr>
          <tr>
            <td>Login / me</td>
            <td><code>app/Http/Controllers/Api/AuthController.php</code></td>
          </tr>
          <tr>
            <td>Form Request</td>
            <td><code>app/Http/Requests/UserRequest.php</code></td>
          </tr>
          <tr>
            <td>Service</td>
            <td><code>app/Services/UserService.php</code></td>
          </tr>
          <tr>
            <td>Escopo</td>
            <td><code>app/Services/ScopeService.php</code></td>
          </tr>
          <tr>
            <td>Repository</td>
            <td><code>app/Repositories/UserRepository.php</code></td>
          </tr>
          <tr>
            <td>Model</td>
            <td><code>app/Models/User.php</code></td>
          </tr>
          <tr>
            <td>Policy (alvo)</td>
            <td><code>app/Policies/UserPolicy.php</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      <code>GET /api/me</code> retorna o usuário autenticado. CRUD de outros usuários:
      prefixo <code>/api/users</code>.
    </p>
  </article>
</template>
