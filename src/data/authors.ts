import type { Author } from '../types';
import authorsData from './authors.json';

export const authors: Record<string, Author> = authorsData as Record<string, Author>;
