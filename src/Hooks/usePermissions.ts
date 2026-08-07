import { useAppSelector } from './Reduxhook/hooks';

export type PermissionParam = string | { module: string; action: string };

export const usePermissions = () => {
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const permissions = currentUser?.permissions || [];

  const isPlatformSuperAdmin =
    currentUser?.Type === 'superadmin' &&
    (currentUser?.company_id === null || currentUser?.company_id === undefined);

  const hasPermission = (check: PermissionParam): boolean => {
    // Platform Super Admin bypasses domain checks
    if (isPlatformSuperAdmin) {
      return true;
    }

    let permName = "";
    if (typeof check === "string") {
      permName = check;
    } else {
      permName = `${check.module}.${check.action}`;
    }

    return permissions.some(
      (permission: any) =>
        permission.name === permName ||
        (typeof check !== "string" &&
          permission.module === check.module &&
          permission.action === check.action)
    );
  };

  const hasAnyPermission = (checks: PermissionParam[]): boolean => {
    return checks.some((check) => hasPermission(check));
  };

  const hasAllPermissions = (checks: PermissionParam[]): boolean => {
    return checks.every((check) => hasPermission(check));
  };

  const canCreate = (targetModule: string): boolean => {
    const permName = targetModule.includes(".") ? `${targetModule}.create` : targetModule;
    return hasPermission(permName);
  };

  const canRead = (targetModule: string): boolean => {
    const permName = targetModule.includes(".") ? `${targetModule}.read` : targetModule;
    return hasPermission(permName);
  };

  const canUpdate = (targetModule: string): boolean => {
    const permName = targetModule.includes(".") ? `${targetModule}.update` : targetModule;
    return hasPermission(permName);
  };

  const canDelete = (targetModule: string): boolean => {
    const permName = targetModule.includes(".") ? `${targetModule}.delete` : targetModule;
    return hasPermission(permName);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    userType: currentUser?.Type,
    companyId: currentUser?.company_id,
    isPlatformSuperAdmin,
    isAdmin: currentUser?.Type === 'superadmin' || currentUser?.Type === 'admin',
  };
};