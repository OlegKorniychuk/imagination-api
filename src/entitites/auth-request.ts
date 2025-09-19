import { Request } from 'express';

export type AuthenticatedUserData = { id: string; email: string };

export type AuthenticatedRequest = Request & { user: AuthenticatedUserData };
