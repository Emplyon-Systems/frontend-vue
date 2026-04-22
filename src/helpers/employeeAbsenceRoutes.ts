/**
 * Rotas de férias / atestados / afastamentos (URL ↔ tipo interno).
 */

export type AbsencePathKind = "vacations" | "medical-certificates" | "leaves";

export type AbsenceTabKind = "vacation" | "medical" | "leaf";

type RoutePrefix = "owner" | "company" | "branch";

export function tabKindToPathKind(kind: AbsenceTabKind): AbsencePathKind {
  if (kind === "vacation") return "vacations";
  if (kind === "medical") return "medical-certificates";
  return "leaves";
}

export function pathKindToTabKind(kind: AbsencePathKind): AbsenceTabKind {
  if (kind === "vacations") return "vacation";
  if (kind === "medical-certificates") return "medical";
  return "leaf";
}

/** Query param `tab` na vista do funcionário (alinhado com índice do separador). */
export function tabQueryForPathKind(kind: AbsencePathKind): string {
  if (kind === "vacations") return "vacations";
  if (kind === "medical-certificates") return "medical";
  return "leaves";
}

export function isAbsencePathKind(s: string): s is AbsencePathKind {
  return s === "vacations" || s === "medical-certificates" || s === "leaves";
}

export function absenceRoutePrefix(routeName: string | undefined | null): RoutePrefix {
  const n = String(routeName ?? "");
  if (n.startsWith("branch.")) return "branch";
  if (n.startsWith("company.")) return "company";
  return "owner";
}

export function employeesAbsencesCreateRouteName(routeName: string | undefined | null): string {
  return `${absenceRoutePrefix(routeName)}.employees.absences.create`;
}

export function employeesAbsencesEditRouteName(routeName: string | undefined | null): string {
  return `${absenceRoutePrefix(routeName)}.employees.absences.edit`;
}

export function employeesViewRouteName(routeName: string | undefined | null): string {
  return `${absenceRoutePrefix(routeName)}.employees.view`;
}
