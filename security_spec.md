# Application Security Specification

## Data Invariants
- Only verified, authenticated users can read/write data in this system for now (since it is an internal POS system, but currently this has no specific user structure, so we assume `isSignedIn()`). Even better, we scope data by a `storeId` or `userId`.
- Numeric balances must be updatable. Update action must only affect `amount` or specific fields.
- `products`, `transactions`, `expenses`, `digitalTopups`, `transfers`, `stockMovements` are the main collections.

## The Dirty Dozen Payloads
1. **Invalid ID Poisoning**: A `productId` with 1500 chars (rejected).
2. **Missing required fields on create**: Creating `Product` without `category`.
3. **Ghost Field Update Request**: Updating `Product` with `{ price: 50, shadow_field: true }`.
4. **Invalid role escalation**: User attempts to set themselves as Admin without being listed.
5. **PII Blanket Test**: No PII exposed since no PII stored currently.
6. **Query Scraping Defeated**: List queries lacking proper `where` predicates for data scope.
7. ... (other payloads as dictated).
