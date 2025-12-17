import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username?: string;
      name: string;
      role: 'Admin' | 'Supervisor' | 'User';
      permissions?: {
        canManageUsers?: boolean;
        canManageForms?: boolean;
        canManageIPs?: boolean;
        canViewSubmissions?: boolean;
        canManageRequests?: boolean;
        canDeleteForms?: boolean;
        canEditForms?: boolean;
        canCreateForms?: boolean;
        canManageSettings?: boolean;
      };
    };
  }

  interface User {
    id: string;
    role: 'Admin' | 'Supervisor' | 'User';
    username?: string;
    permissions?: Session['user']['permissions'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'Admin' | 'Supervisor' | 'User';
    permissions?: Session['user']['permissions'];
  }
}

