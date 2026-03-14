/**
 * Shared types and utilities for LinkDrop V2
 */

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Link {
  id: string;
  url: string;
  title?: string;
  userId: string;
}

export const APP_NAME = "LinkDrop V2";
