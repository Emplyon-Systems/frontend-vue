/**
 * Item exibido no sino, na página de notificações e nas listagens com estado "lida".
 */
export type AppNotificationItem = {
  id: string;
  source: string;
  title: string;
  message: string;
  dateLabel?: string;
  iconClass?: string;
  iconVariantClass?: string;
  routeName?: string;
};
