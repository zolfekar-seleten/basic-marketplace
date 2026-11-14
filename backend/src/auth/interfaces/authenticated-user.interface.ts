export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
}
