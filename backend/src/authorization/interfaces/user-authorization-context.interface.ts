export interface UserAuthorizationContext {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  permissions: string[];
  permissionsVersion: number;
}
