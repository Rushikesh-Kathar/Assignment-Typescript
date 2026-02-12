export interface UpdateUserData {
    name?: string;
    email?: string;
    age?: number;
    mobile?: number;
    password?: string;
    teamId?: string;
    roleId?: string;
}

// Add User interface for CASL RBAC
export interface User {
    id: string;
    name: string;
    email: string;
    age?: number;
    mobile?: number;
    teamId?: string;
    roleId?: string;
    role: string;
}
