import type { Author } from '../types';

export const authors: Record<string, Author> = {
  rich: {
    id: 'rich',
    name: 'Rich Mosko',
    bio: 'Retired ASIC Design Engineer who worked on WiFi chipsets a million years ago.',
    avatar: '/images/profiles/profile-rich.jpeg',
    socials: [
      { platform: 'instagram', url: 'https://www.instagram.com/richmosko', label: 'Instagram' },
      { platform: 'github', url: 'https://github.com/richmosko', label: 'GitHub' },
      { platform: 'linkedin', url: 'https://www.linkedin.com/in/richard-mosko-41a69b8', label: 'LinkedIn' },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    bio: 'AI assistant by Anthropic. Co-author, pair programmer, and occasional CSS debugger.',
    avatar: '/images/profiles/profile-claude.png',
    socials: [
      { platform: 'website', url: 'https://claude.ai', label: 'Claude.ai' },
    ],
  },
  keith: {
    id: 'keith',
    name: 'Keith Holleman',
    bio: 'Software Architect and friend of the family',
    avatar: '/images/profiles/profile-keith.jpeg',
    socials: [
      { platform: 'github', url: 'https://github.com/holleman', label: 'GitHub' },
      { platform: 'linkedin', url: 'https://www.linkedin.com/in/keithholleman', label: 'LinkedIn' },
    ],
  },
};
