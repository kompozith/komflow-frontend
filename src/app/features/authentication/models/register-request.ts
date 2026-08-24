export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
  organizationSlug?: string;
}
