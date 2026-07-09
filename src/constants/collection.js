export const COLLECTION_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

// Status of the dedicated Paystack account tied to a collection.
export const ACCOUNT_STATUS = {
  CREATING: 'creating',
  ACTIVE: 'active',
  FAILED: 'failed',
}

export const PAYMENT_SOURCE = {
  MANUAL: 'manual',
  PAYSTACK: 'paystack',
}

export function computeCollectionStatus(totalAmount, collectedAmount) {
  if (collectedAmount <= 0) return COLLECTION_STATUS.PENDING
  if (collectedAmount >= totalAmount) return COLLECTION_STATUS.COMPLETED
  return COLLECTION_STATUS.IN_PROGRESS
}
