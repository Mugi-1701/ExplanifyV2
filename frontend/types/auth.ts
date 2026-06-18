export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthOrganization = {
  id: string;
  name: string;
  slug?: string | null;
};

export type AuthPayload = {
  user?: AuthUser;
  organization?: AuthOrganization | null;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  orgName?: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type AuthError = {
  message: string;
  status?: number;
};
