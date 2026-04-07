/**
 * When listing "All Stores", each row may still carry `store_id`. Prefer that on writes;
 * otherwise use the header selection.
 */
export function resolveStoreIdForWrite(
  rowStoreId: number | undefined | null,
  selectedStoreId: number | null
): number | null {
  if (rowStoreId != null && Number.isFinite(Number(rowStoreId))) {
    return Number(rowStoreId);
  }
  return selectedStoreId;
}
