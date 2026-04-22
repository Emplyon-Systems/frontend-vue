<template>
  <article class="doc-article">
    <h1>Módulo completo — exemplo <code>companies</code></h1>
    <p class="doc-lead">
      Listagem de empresas no painel owner: fluxo encadeado entre rota, página, view e API.
    </p>

    <h2>1. Rota</h2>
    <p>
      Em <code>routes.ts</code>, rota <code>/companies</code>, nome <code>owner.companies</code>,
      <code>meta.authRequired</code>, <code>meta.permission</code> para listar, componente
      <code>pages/panels/owner/companies/index.vue</code>.
    </p>

    <h2>2. Page — <code>pages/.../companies/index.vue</code></h2>
    <p>
      Usa <code>DefaultLayout</code>, componentes de listagem (<code>ListagemCard</code>,
      filtros, tabela), importa <code>companiesApi</code> e chama
      <code>companiesApi.list(appliedFilters)</code> no mount / ao paginar. Navegação para create,
      view, edit via <code>useRouter()</code>.
    </p>

    <h2>3. View auxiliar</h2>
    <p>
      <code>views/panels/owner/companies/Filter.vue</code> concentra o painel de filtros reutilizável
      pela page.
    </p>

    <h2>4. API — <code>api/resources/companies.ts</code></h2>
    <pre class="doc-pre" v-pre><code>const base = "/companies";

export async function list(params?: CompaniesListParams) {
  const res = await http.post(base, params ?? {});
  return res.data;
}</code></pre>
    <p>
      Tipos <code>CompanyRecord</code>, <code>CompaniesListParams</code> e payloads de create/update
      ficam junto do recurso ou em <code>types/api</code>.
    </p>

    <h2>5. Auth</h2>
    <p>
      <code>useAuthStore().can('permission:…')</code> alinha-se ao backend para esconder botões ou
      fluxos que o usuário não pode usar.
    </p>

    <p class="doc-callout">
      O mesmo padrão aplica-se a <code>users</code>, <code>branches</code>, etc.: nova pasta em
      <code>pages</code> + <code>views</code> + arquivo em <code>api/resources</code>.
    </p>
  </article>
</template>
