/** Cross-tab signal when an admin updates a user (same browser profile). */
export const AUTH_BROADCAST_CHANNEL = "cash-track-auth";

export type AuthBroadcastMessage =
  | { type: "role-maybe-changed"; userId: number };

export function broadcastRoleMaybeChanged(userId: number): void {
  if (typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  const msg: AuthBroadcastMessage = {
    type: "role-maybe-changed",
    userId: Number(userId),
  };
  ch.postMessage(msg);
  ch.close();
}
