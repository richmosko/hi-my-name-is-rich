import type { Author } from '../types';
import authorsData from './authors.json';

// Convert array format (used by Keystatic singleton) to keyed record
const authorsArray = (authorsData as { authors: Author[] }).authors;
export const authors: Record<string, Author> = Object.fromEntries(
  authorsArray.map((a) => [a.id, a])
);
