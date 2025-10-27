import { RoleType } from "@prisma/client";

export const hasPermission = (userRole: string, requiredRoles: RoleType[]) => {
  return requiredRoles.includes(userRole as RoleType);
};

export const isAdmin = (userRole: string) => {
  return hasPermission(userRole, ["ADMIN", "SUPER_ADMIN"]);
};

export const isSuperAdmin = (userRole: string) => {
  return hasPermission(userRole, ["SUPER_ADMIN"]);
};

export const canManageUsers = (userRole: string) => {
  return hasPermission(userRole, ["ADMIN", "SUPER_ADMIN"]);
};

export const canCreateLoans = (userRole: string) => {
  return hasPermission(userRole, ["COMMON", "ADMIN", "SUPER_ADMIN"]);
};

export const canManageEquipments = (userRole: string) => {
  return hasPermission(userRole, ["ADMIN", "SUPER_ADMIN"]);
};

export const canManageCategories = (userRole: string) => {
  return hasPermission(userRole, ["ADMIN", "SUPER_ADMIN"]);
};

export const canGenerateReports = (userRole: string) => {
  return hasPermission(userRole, ["SUPER_ADMIN"]);
};
