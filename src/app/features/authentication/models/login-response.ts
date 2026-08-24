import { AuthUser } from "./auth-user";
import { WorkspaceSummary } from "../../organization/services/workspace.service";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    phoneNumbers?: any[];
  };
  permissions: {
    permissions: string[];
    roles: string[];
  };
  /** Workspaces the user belongs to, so the app can detect "no workspace" right after login. */
  workspaces?: WorkspaceSummary[];
}
