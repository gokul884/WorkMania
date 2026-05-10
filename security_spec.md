# Security Specification for WorkMania

## Data Invariants
1. A document (Client, Project, Task, Invoice, Activity) cannot exist without a `userId` that strictly matches the authenticated user's UID.
2. Every document must have a `userId` field of type string.
3. `id` fields (if stored in data) must be consistent with the document ID.

## The "Dirty Dozen" Payloads
These payloads attempt to bypass security and must be rejected:
1. **Cross-User Read**: Auth User A tries to read a document owned by User B.
2. **Identity Spoofing (Create)**: Auth User A tries to create a document with `userId: User_B`.
3. **Identity Spoofing (Update)**: Auth User A tries to change the `userId` of their own document to `User_B`.
4. **Shadow Write**: Auth User A tries to add a `ghostField: true` to a document.
5. **Type Poisoning**: Auth User A tries to set `budget` to a 1MB string instead of a number.
6. **Path Injection**: User tries to create a document with an ID containing malicious characters.
7. **Unauthenticated Read**: Un-auth user tries to list any collection.
8. **Unauthenticated Write**: Un-auth user tries to create a document.
9. **Enum Violation**: User tries to set project status to `malicious_status`.
10. **State Locking Bypass**: (If applicable) User tries to update an invoice marked as `paid` (I will implement a check for this if needed).
11. **Massive String Attack**: User tries to set a client name to a 1MB string.
12. **Query Scraping**: User tries to list all documents without filtering by their own `userId` (The rule must enforce the `resource.data.userId` check).
