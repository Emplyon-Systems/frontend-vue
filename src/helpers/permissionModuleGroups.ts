/**
 * Agrupa permissões por prefixo do slug (módulo) para UI de perfis.
 * Os prefixos employee_vacations, employee_medical_certificates e employee_leaves
 * aparecem aninhados dentro de «Funcionários».
 * role_templates, modality_type_templates e modality_type_template_items
 * aparecem aninhados dentro de «Templates» (como no menu do painel).
 */

export type PermissionPluck = { id: number; name: string; slug: string };

export type PermissionOption = { id: number; name: string; slug: string; label: string };

export type EmployeesSection = {
  sectionKey: string;
  sectionLabel: string;
  options: PermissionOption[];
  total: number;
  selected: number;
};

/** Grupo simples (um bloco de checkboxes). */
export type SimplePermissionGroup = {
  kind: "simple";
  moduleName: string;
  moduleLabel: string;
  options: PermissionOption[];
  total: number;
  selected: number;
};

/** Funcionários: cadastro + férias + atestados + afastamentos. */
export type EmployeesNestedPermissionGroup = {
  kind: "employees";
  moduleName: "employees";
  moduleLabel: string;
  sections: EmployeesSection[];
  total: number;
  selected: number;
};

/** Templates: perfis (provisionamento) + pacotes globais de modalidade + itens. */
export type TemplatesNestedPermissionGroup = {
  kind: "templates";
  moduleName: "templates";
  moduleLabel: string;
  sections: EmployeesSection[];
  total: number;
  selected: number;
};

export type GroupedPermissionModule =
  | SimplePermissionGroup
  | EmployeesNestedPermissionGroup
  | TemplatesNestedPermissionGroup;

const EMPLOYEE_CLUSTER = new Set([
  "employees",
  "employee_vacations",
  "employee_medical_certificates",
  "employee_leaves",
]);

const TEMPLATES_CLUSTER = new Set([
  "role_templates",
  "modality_type_templates",
  "modality_type_template_items",
]);

/** Ordem das secções dentro de Funcionários. */
const EMPLOYEE_SECTION_ORDER = [
  "employees",
  "employee_vacations",
  "employee_medical_certificates",
  "employee_leaves",
] as const;

/** Ordem das secções dentro de Templates (novos módulos: acrescentar aqui e em TEMPLATES_CLUSTER). */
const TEMPLATE_SECTION_ORDER = [
  "role_templates",
  "modality_type_templates",
  "modality_type_template_items",
] as const;

const SECTION_LABELS: Record<string, string> = {
  employees: "Cadastro de funcionários",
  employee_vacations: "Férias",
  employee_medical_certificates: "Atestados médicos",
  employee_leaves: "Afastamentos",
};

/** Rótulos das subsecções de Templates (alinhados ao submenu «Templates» do menu). */
const TEMPLATE_SECTION_LABELS: Record<string, string> = {
  role_templates: "Templates de perfil",
  modality_type_templates: "Modalidades de domingo",
  modality_type_template_items: "Itens dos templates de modalidade",
};

const MODULE_LABELS: Record<string, string> = {
  audits: "Auditoria",
  branches: "Filiais",
  companies: "Empresas",
  employees: "Funcionários",
  employee_day_offs: "Folgas aprovadas",
  employee_leave_requests: "Solicitações de folga",
  day_off_modalities: "Modalidades de folga",
  modality_types: "Modalidade de domingo",
  permissions: "Permissões",
  positions: "Cargos",
  role_templates: "Templates de perfil",
  modality_type_templates: "Templates de modalidades (globais)",
  modality_type_template_items: "Itens dos templates de modalidade",
  scale_types: "Tipos de escala",
  roles: "Perfis",
  sectors: "Setores",
  shifts: "Turnos",
  tutorial_categories: "Categorias de tutoriais",
  tutorials: "Tutoriais",
  users: "Usuários",
};

export function getPermissionModuleLabel(moduleName: string): string {
  return MODULE_LABELS[moduleName] ?? moduleName;
}

function countSelected(options: PermissionOption[], selected: Set<number>): number {
  return options.filter((o) => selected.has(o.id)).length;
}

function buildEmployeesNested(
  groups: Map<string, PermissionOption[]>,
  selected: Set<number>
): EmployeesNestedPermissionGroup {
  const sections: EmployeesSection[] = [];
  for (const key of EMPLOYEE_SECTION_ORDER) {
    const raw = groups.get(key);
    if (!raw?.length) continue;
    const sorted = [...raw].sort((a, b) => a.label.localeCompare(b.label));
    const sel = countSelected(sorted, selected);
    sections.push({
      sectionKey: key,
      sectionLabel: SECTION_LABELS[key] ?? key,
      options: sorted,
      total: sorted.length,
      selected: sel,
    });
  }
  const total = sections.reduce((s, sec) => s + sec.total, 0);
  const selectedCount = sections.reduce((s, sec) => s + sec.selected, 0);

  return {
    kind: "employees",
    moduleName: "employees",
    moduleLabel: MODULE_LABELS.employees ?? "Funcionários",
    sections,
    total,
    selected: selectedCount,
  };
}

const TEMPLATES_HUB_LABEL = "Templates";

function templateSectionSortKey(moduleKey: string): number {
  const idx = (TEMPLATE_SECTION_ORDER as readonly string[]).indexOf(moduleKey);
  return idx === -1 ? 1000 : idx;
}

function buildTemplatesNested(
  groups: Map<string, PermissionOption[]>,
  selected: Set<number>
): TemplatesNestedPermissionGroup {
  const moduleKeys = [...groups.keys()]
    .filter((k) => TEMPLATES_CLUSTER.has(k) && groups.get(k)?.length)
    .sort((a, b) => templateSectionSortKey(a) - templateSectionSortKey(b) || a.localeCompare(b));

  const sections: EmployeesSection[] = [];
  for (const key of moduleKeys) {
    const raw = groups.get(key);
    if (!raw?.length) continue;
    const sorted = [...raw].sort((a, b) => a.label.localeCompare(b.label));
    const sel = countSelected(sorted, selected);
    sections.push({
      sectionKey: key,
      sectionLabel: TEMPLATE_SECTION_LABELS[key] ?? getPermissionModuleLabel(key),
      options: sorted,
      total: sorted.length,
      selected: sel,
    });
  }
  const total = sections.reduce((s, sec) => s + sec.total, 0);
  const selectedCount = sections.reduce((s, sec) => s + sec.selected, 0);

  return {
    kind: "templates",
    moduleName: "templates",
    moduleLabel: TEMPLATES_HUB_LABEL,
    sections,
    total,
    selected: selectedCount,
  };
}

/**
 * @param permissionOptions lista da API (plucks)
 * @param selectedIds IDs atualmente selecionados no formulário
 * @param searchTerm filtro opcional (nome/slug)
 */
export function buildGroupedPermissionModules(
  permissionOptions: PermissionPluck[],
  selectedIds: number[],
  searchTerm: string
): GroupedPermissionModule[] {
  const term = searchTerm.trim().toLowerCase();
  const selected = new Set(selectedIds);
  const groups = new Map<string, PermissionOption[]>();

  for (const permission of permissionOptions) {
    const moduleName = permission.slug?.split(".")?.[0] || "geral";
    const slug = permission.slug ?? "";
    const searchText = `${permission.name} ${slug}`.toLowerCase();
    if (term && !searchText.includes(term)) continue;
    const label = permission.name;

    if (!groups.has(moduleName)) groups.set(moduleName, []);
    groups.get(moduleName)!.push({
      id: permission.id,
      name: permission.name,
      slug: permission.slug ?? "",
      label,
    });
  }

  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const out: GroupedPermissionModule[] = [];
  let mergedEmployeeCluster = false;
  let mergedTemplatesCluster = false;

  for (const key of keys) {
    if (EMPLOYEE_CLUSTER.has(key)) {
      if (!mergedEmployeeCluster) {
        mergedEmployeeCluster = true;
        out.push(buildEmployeesNested(groups, selected));
      }
      continue;
    }

    if (TEMPLATES_CLUSTER.has(key)) {
      if (!mergedTemplatesCluster) {
        mergedTemplatesCluster = true;
        out.push(buildTemplatesNested(groups, selected));
      }
      continue;
    }

    const options = groups.get(key)!;
    const sorted = options.sort((a, b) => a.label.localeCompare(b.label));
    const sel = countSelected(sorted, selected);
    out.push({
      kind: "simple",
      moduleName: key,
      moduleLabel: getPermissionModuleLabel(key),
      options: sorted,
      total: sorted.length,
      selected: sel,
    });
  }

  return out;
}

/** IDs de todas as permissões num grupo (simples ou secções aninhadas). */
export function collectPermissionIdsFromGroup(group: GroupedPermissionModule): number[] {
  if (group.kind === "simple") {
    return group.options.map((o) => o.id);
  }
  return group.sections.flatMap((s) => s.options.map((o) => o.id));
}

/** IDs de uma secção dentro do grupo Funcionários. */
export function collectPermissionIdsFromEmployeesSection(
  group: EmployeesNestedPermissionGroup,
  sectionKey: string
): number[] {
  const sec = group.sections.find((s) => s.sectionKey === sectionKey);
  return sec ? sec.options.map((o) => o.id) : [];
}

/** IDs de uma secção dentro do grupo Templates. */
export function collectPermissionIdsFromTemplatesSection(
  group: TemplatesNestedPermissionGroup,
  sectionKey: string
): number[] {
  const sec = group.sections.find((s) => s.sectionKey === sectionKey);
  return sec ? sec.options.map((o) => o.id) : [];
}

/** Item só leitura (perfil do usuário — sem id). */
export type PermissionReadItem = { name: string; slug: string };

export type ReadEmployeesSectionView = {
  sectionKey: string;
  sectionLabel: string;
  permissions: PermissionReadItem[];
};

export type GroupedReadOnlyModule =
  | {
      kind: "simple";
      moduleName: string;
      moduleLabel: string;
      permissions: PermissionReadItem[];
      total: number;
    }
  | {
      kind: "employees";
      moduleName: "employees";
      moduleLabel: string;
      sections: ReadEmployeesSectionView[];
      total: number;
    }
  | {
      kind: "templates";
      moduleName: "templates";
      moduleLabel: string;
      sections: ReadEmployeesSectionView[];
      total: number;
    };

function buildEmployeesNestedRead(groups: Map<string, PermissionReadItem[]>): GroupedReadOnlyModule {
  const sections: ReadEmployeesSectionView[] = [];
  for (const key of EMPLOYEE_SECTION_ORDER) {
    const raw = groups.get(key);
    if (!raw?.length) continue;
    const sorted = [...raw].sort((a, b) => a.name.localeCompare(b.name));
    sections.push({
      sectionKey: key,
      sectionLabel: SECTION_LABELS[key] ?? key,
      permissions: sorted,
    });
  }
  const total = sections.reduce((s, sec) => s + sec.permissions.length, 0);
  return {
    kind: "employees",
    moduleName: "employees",
    moduleLabel: MODULE_LABELS.employees ?? "Funcionários",
    sections,
    total,
  };
}

function buildTemplatesNestedRead(groups: Map<string, PermissionReadItem[]>): GroupedReadOnlyModule {
  const moduleKeys = [...groups.keys()]
    .filter((k) => TEMPLATES_CLUSTER.has(k) && groups.get(k)?.length)
    .sort((a, b) => templateSectionSortKey(a) - templateSectionSortKey(b) || a.localeCompare(b));

  const sections: ReadEmployeesSectionView[] = [];
  for (const key of moduleKeys) {
    const raw = groups.get(key);
    if (!raw?.length) continue;
    const sorted = [...raw].sort((a, b) => a.name.localeCompare(b.name));
    sections.push({
      sectionKey: key,
      sectionLabel: TEMPLATE_SECTION_LABELS[key] ?? getPermissionModuleLabel(key),
      permissions: sorted,
    });
  }
  const total = sections.reduce((s, sec) => s + sec.permissions.length, 0);
  return {
    kind: "templates",
    moduleName: "templates",
    moduleLabel: TEMPLATES_HUB_LABEL,
    sections,
    total,
  };
}

/**
 * Agrupa permissões só leitura (nome/slug) com o mesmo aninhamento de Funcionários e Templates.
 */
export function buildGroupedReadOnlyModules(permissions: PermissionReadItem[]): GroupedReadOnlyModule[] {
  const groups = new Map<string, PermissionReadItem[]>();
  for (const permission of permissions) {
    const moduleName = permission.slug?.split(".")?.[0] || "geral";
    if (!groups.has(moduleName)) groups.set(moduleName, []);
    groups.get(moduleName)!.push(permission);
  }

  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const out: GroupedReadOnlyModule[] = [];
  let mergedEmployeeCluster = false;
  let mergedTemplatesCluster = false;

  for (const key of keys) {
    if (EMPLOYEE_CLUSTER.has(key)) {
      if (!mergedEmployeeCluster) {
        mergedEmployeeCluster = true;
        out.push(buildEmployeesNestedRead(groups));
      }
      continue;
    }

    if (TEMPLATES_CLUSTER.has(key)) {
      if (!mergedTemplatesCluster) {
        mergedTemplatesCluster = true;
        out.push(buildTemplatesNestedRead(groups));
      }
      continue;
    }

    const list = groups.get(key)!;
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    out.push({
      kind: "simple",
      moduleName: key,
      moduleLabel: getPermissionModuleLabel(key),
      permissions: sorted,
      total: sorted.length,
    });
  }

  return out;
}
