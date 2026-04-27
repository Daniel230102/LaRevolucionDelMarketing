# Security Specification - Business Identity CRM

## 1. Data Invariants
- A **Company** must have a unique `ownerId` matching the creator's UID.
- **Sub-resources** (Products, Leads, Competitors, Automations, Reports) must always belong to a Company that exists and whose `ownerId` matches the requester's UID.
- **User Profiles** are private to the authenticated user.
- **Timestamps** must be validated where applicable.
- **Immutable fields**: `ownerId` and `companyId` cannot be changed after creation.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

### T1: Identity Spoofing (Company)
Try to create a company with someone else's `ownerId`.
```json
{
  "name": "Evil Corp",
  "ownerId": "attacker_uid",
  "createdAt": "2023-01-01T00:00:00Z"
}
```
**Expected**: PERMISSION_DENIED (ownerId mismatch)

### T2: Resource Poisoning (ID)
Try to create a company with a 2KB junk string as ID.
```javascript
// Path: /companies/[2KB_STRING]
```
**Expected**: PERMISSION_DENIED (isValidId check)

### T3: Shadow Field Injection
Try to add an `isAdmin` field to a company.
```json
{
  "name": "My Company",
  "ownerId": "user_uid",
  "isAdmin": true
}
```
**Expected**: PERMISSION_DENIED (Strict schema/keys)

### T4: Cross-Tenant Access (Read)
Try to read a company document belonging to another user.
**Expected**: PERMISSION_DENIED

### T5: Orphaned Resource (Product)
Try to create a product for a company that doesn't exist.
**Expected**: PERMISSION_DENIED (exists check)

### T6: Stealing Ownership (Update)
Try to update a company's `ownerId` to yourself.
**Expected**: PERMISSION_DENIED (Immutability check)

### T7: State Shortcutting (Automation)
Try to set an automation status to 'completed' directly on creation.
**Expected**: PERMISSION_DENIED (Validation helper constraints)

### T8: PII Leak (User Profile)
Try to read another user's profile.
**Expected**: PERMISSION_DENIED

### T9: Recursive Cost Attack (List)
Try to list all companies without a filter.
**Expected**: PERMISSION_DENIED (Rule enforces ownerId check)

### T10: Denial of Wallet (Size)
Try to set a company name string to 1MB.
**Expected**: PERMISSION_DENIED (Size enclosure)

### T11: Sync Vulnerability (Report)
Try to create a report directly without being the owner of the parent company.
**Expected**: PERMISSION_DENIED (Master Gate)

### T12: Privilege Escalation
Try to update a report (reports should be immutable).
**Expected**: PERMISSION_DENIED
