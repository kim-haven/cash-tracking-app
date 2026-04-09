/** Fired after admin actions that may create server-side notifications (e.g. role change). */
export const NOTIFICATIONS_REFETCH_EVENT = "cash-track-refetch-notifications";

export function dispatchNotificationsRefetch(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_REFETCH_EVENT));
}
