import type { AppNotificationItem } from "@/types/notificationInbox";
import type { EmployeeLeaveRequestRecord } from "@/types/api";

export function formatNotificationDate(value?: string | null): string {
  if (!value) return "";
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return String(value);
  return `${day}/${m}/${y}`;
}

export function mapPendingLeaveToNotification(
  row: EmployeeLeaveRequestRecord
): AppNotificationItem {
  return {
    id: `leave-request-${row.id}`,
    source: "leave_requests",
    title: "Nova solicitação de folga",
    message: `${row.employee?.name || "Colaborador"}: ${row.reason}`,
    dateLabel: formatNotificationDate(row.request_date),
    iconClass: "iconoir-calendar fs-4",
    iconVariantClass: "bg-warning-subtle text-warning",
    routeName: "branch.leave-requests",
  };
}

export function mapResponseLeaveToNotification(
  row: EmployeeLeaveRequestRecord
): AppNotificationItem {
  const isApproved = row.status === "approved";
  return {
    id: `leave-response-${row.id}`,
    source: "leave_request_responses",
    title: isApproved ? "Folga aprovada" : "Folga rejeitada",
    message: isApproved
      ? `A sua folga a ${formatNotificationDate(row.request_date)} foi aprovada.`
      : `A sua folga a ${formatNotificationDate(row.request_date)} foi rejeitada.${
          row.review_notes ? ` Nota: ${row.review_notes}` : ""
        }`,
    dateLabel: formatNotificationDate(row.reviewed_at ?? row.updated_at),
    iconClass: isApproved ? "iconoir-check-circle fs-4" : "iconoir-circle-xmark fs-4",
    iconVariantClass: isApproved
      ? "bg-success-subtle text-success"
      : "bg-danger-subtle text-danger",
    routeName: "employee.leave-requests",
  };
}
