/**
 * Derived constellation graph data — nodes and edges between posts.
 *
 * Edges:
 *  - wikilink: a post explicitly references another via [[slug]] or [[slug|text]]
 *  - tag:      two posts share one or more tags
 *
 * Built at compile time from MDX raw content + frontmatter via import.meta.glob.
 * No separate JSON file or pre-build script needed.
 */

interface MdxFrontmatter {
  title?: string;
  date?: string;
  featured?: boolean;
  image?: string;
  categories?: string | string[];
  tags?: string[];
}

interface MdxModule {
  frontmatter: MdxFrontmatter;
}

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  categories: string[];
  tags: string[];
  date: string;
  featured: boolean;
  image: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wikilink' | 'tag' | 'category';
  shared?: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Build-time globs: compiled modules (for frontmatter) + raw text (for wikilinks)
const compiledModules = import.meta.glob<MdxModule>('../content/posts/*.mdx', {
  eager: true,
});

const rawModules = import.meta.glob<string>('../content/posts/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Extract [[slug]] or [[slug|display text]] wikilinks from MDX body */
function extractWikilinks(raw: string): string[] {
  const body = raw.replace(/^---\n[\s\S]*?\n---/, '');
  const links = new Set<string>();
  const re = /\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const slug = m[1]
      .trim()
      .replace(/\.mdx$/, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
    links.add(slug);
  }
  return [...links];
}

function pathToSlug(path: string): string {
  return path.split('/').pop()!.replace(/\.mdx$/, '');
}

// Build nodes from all posts
const nodes: GraphNode[] = Object.entries(compiledModules).map(([path, mod]) => {
  const slug = pathToSlug(path);
  const fm = mod.frontmatter || {};
  const categories = Array.isArray(fm.categories)
    ? fm.categories
    : fm.categories
      ? [fm.categories]
      : [];

  return {
    id: slug,
    title: fm.title || slug,
    category: categories[0] || 'musings',
    categories,
    tags: fm.tags ?? [],
    date: fm.date ?? '',
    featured: fm.featured === true,
    image: fm.image || '',
  };
});

const nodesBySlug = new Map(nodes.map((n) => [n.id, n]));

// Build edges
const edges: GraphEdge[] = [];
const edgeSet = new Set<string>();

function addEdge(source: string, target: string, type: GraphEdge['type'], meta: Partial<GraphEdge> = {}) {
  const key = [source, target].sort().join('::') + '::' + type;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({ source, target, type, ...meta });
}

// 1. Wikilink edges (from raw MDX body)
for (const [path, raw] of Object.entries(rawModules)) {
  const sourceSlug = pathToSlug(path);
  if (!nodesBySlug.has(sourceSlug)) continue;
  for (const targetSlug of extractWikilinks(raw)) {
    if (nodesBySlug.has(targetSlug)) {
      addEdge(sourceSlug, targetSlug, 'wikilink');
    }
  }
}

// 2. Shared-tag edges
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i];
    const b = nodes[j];
    const shared = a.tags.filter((t) => b.tags.includes(t));
    if (shared.length > 0) {
      addEdge(a.id, b.id, 'tag', { shared });
    }
  }
}

export const graphData: GraphData = { nodes, edges };
