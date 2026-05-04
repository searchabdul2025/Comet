# Role-Based Access Control (RBAC)

This document explains the permission system implemented in Comet Portal.

## Roles

The system has three roles:
1. **Admin** - Full access to all features
2. **Supervisor** - Limited access to forms and requests
3. **User** - No management access (view-only)

## Permission Matrix

| Feature | Admin | Supervisor | User |
|---------|-------|------------|------|
| **User Management** | ✅ | ❌ | ❌ |
| **Create Forms** | ✅ | ✅ | ❌ |
| **Edit Forms** | ✅ | ✅ | ❌ |
| **Delete Forms** | ✅ | ❌ | ❌ |
| **View Forms** | ✅ | ✅ | ✅ |
| **IP Management** | ✅ | ❌ | ❌ |
| **Manage Requests** | ✅ | ✅ | ❌ |
| **View Submissions** | ✅ | ✅ | ❌ |

## Detailed Permissions

### Admin
- ✅ Can manage all users (create, edit, delete, reset passwords)
- ✅ Can create, edit, and delete forms
- ✅ Can manage IP addresses
- ✅ Can view and manage requests
- ✅ Can view form submissions

### Supervisor
- ❌ Cannot manage users
- ✅ Can create and edit forms
- ❌ Cannot delete forms
- ❌ Cannot manage IP addresses
- ✅ Can view and manage requests
- ✅ Can view form submissions

### User
- ❌ Cannot manage users
- ❌ Cannot create, edit, or delete forms
- ❌ Cannot manage IP addresses
- ❌ Cannot manage requests
- ❌ Cannot view submissions
- ✅ Can view forms (read-only)

## Implementation

### Backend (API Routes)
All API routes check permissions before allowing operations:
- `/api/users/*` - Requires `canManageUsers` (Admin only)
- `/api/forms` POST - Requires `canCreateForms` (Admin, Supervisor)
- `/api/forms/[id]` PUT - Requires `canEditForms` (Admin, Supervisor)
- `/api/forms/[id]` DELETE - Requires `canDeleteForms` (Admin only)

### Frontend (UI)
- Sidebar navigation items are filtered based on permissions
- Delete buttons are hidden for users without delete permissions
- Pages show error messages if accessed without proper permissions

## Testing Permissions

Use these test accounts:

**Admin:**
- Email: `admin@cometportal.com`
- Password: `admin123`

**Supervisor:**
- Email: `supervisor@cometportal.com`
- Password: `supervisor123`

**User:**
- Email: `user@cometportal.com`
- Password: `user123`

## Permission Files

- `lib/permissions.ts` - Permission definitions and helper functions
- `lib/requireAuth.ts` - Authentication and permission checking utilities

