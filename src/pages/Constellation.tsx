import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import graphData from '../lib/graph-index.json';
import { useTheme } from '../hooks/useTheme';
import {
  type GraphNode,
  type GraphEdge,
  initializePositions,
  computeNodeMetrics,
  tick,
} from '../lib/forceLayout';

// Category → star color (hex for canvas)
const STAR_COLORS: Record<string, string> = {
  travel: '#34d399',
  design: '#c084fc',
  finance: '#fbbf24',
  projects: '#38bdf8',
  musings: '#fb7185',
  'cool-shit': '#fb923c',
  food: '#a3e635',
};

// Generate distinct colors for tags using golden-angle hue spacing
function generateTagColors(edges: typeof graphData.edges): Record<string, string> {
  const tags = new Set<string>();
  edges.forEach((e) => {
    if (e.type === 'tag' && e.shared) {
      e.shared.forEach((t) => tags.add(t));
    }
  });

  const colors: Record<string, string> = {};
  const sorted = [...tags].sort();
  const goldenAngle = 137.508;

  sorted.forEach((tag, i) => {
    const hue = (i * goldenAngle) % 360;
    colors[tag] = `hsl(${hue}, 70%, 60%)`;
  });
  return colors;
}

const TAG_COLORS = generateTagColors(graphData.edges);

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Parse hsl() string to usable format for canvas
function hslToString(hsl: string, alpha: number): string {
  // hsl(120, 70%, 60%) → hsla(120, 70%, 60%, 0.5)
  return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Graph data refs
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animFrameRef = useRef<number>(0);
  const twinkleRef = useRef<number[]>([]);

  // Interaction refs
  const hoveredRef = useRef<GraphNode | null>(null);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const panRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Camera
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Filter state
  const [showWikilinks, setShowWikilinks] = useState(true);
  const [showTags, setShowTags] = useState(true);

  // Display size ref
  const sizeRef = useRef({ w: 800, h: 600 });

  // Theme ref (so render loop sees latest without re-creating)
  const themeRef = useRef(isDark);
  themeRef.current = isDark;

  // Screen → world
  const screenToWorld = useCallback((clientX: number, clientY: number): { wx: number; wy: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const cam = cameraRef.current;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      wx: (sx - w / 2) / cam.zoom + w / 2 - cam.x,
      wy: (sy - h / 2) / cam.zoom + h / 2 - cam.y,
    };
  }, []);

  // Hit test
  const getNodeAt = useCallback((clientX: number, clientY: number): GraphNode | null => {
    const { wx, wy } = screenToWorld(clientX, clientY);
    const hitRadius = 20 / cameraRef.current.zoom;
    let closest: GraphNode | null = null;
    let closestDist = Infinity;
    for (const node of nodesRef.current) {
      const dx = wx - node.x;
      const dy = wy - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius && dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }
    return closest;
  }, [screenToWorld]);

  // ─── Initialize ───────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    if (nodesRef.current.length === 0) {
      const nodes: GraphNode[] = (graphData.nodes as Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'connections' | 'radius'>[]).map((n) => ({
        ...n, x: 0, y: 0, vx: 0, vy: 0, connections: 0, radius: 4,
      }));
      nodesRef.current = nodes;
      edgesRef.current = graphData.edges as GraphEdge[];
      twinkleRef.current = nodes.map(() => Math.random() * Math.PI * 2);
      computeNodeMetrics(nodes, edgesRef.current);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      sizeRef.current = { w: rect.width, h: rect.height };

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      initializePositions(nodes, rect.width, rect.height);
      let alpha = 1.0;
      for (let i = 0; i < 300; i++) {
        tick(nodes, edges, rect.width, rect.height, alpha);
        alpha *= 0.98;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Render loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      const { w, h } = sizeRef.current;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cam = cameraRef.current;
      const hovered = hoveredRef.current;
      const draggedNode = draggedNodeRef.current;
      const time = frameCount * 0.015;
      const dark = themeRef.current;

      // Always tick
      const alpha = draggedNode ? 0.3 : 0.015;
      tick(nodes, edges, w, h, alpha);

      if (draggedNode) {
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      }

      // ─── Draw ──────────────────────────────────
      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background — match site theme
      if (dark) {
        ctx.fillStyle = '#121212';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, w, h);

      // Camera transform
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-w / 2 + cam.x, -h / 2 + cam.y);

      // Build filtered edges + node map
      const filteredEdges = edges.filter((e) => {
        if (e.type === 'wikilink' && !showWikilinks) return false;
        if (e.type === 'tag' && !showTags) return false;
        return true;
      });
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // ─── Edges ─────────────────────────────────
      for (const edge of filteredEdges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;

        let edgeAlpha: number;
        let lineWidth: number;
        let strokeColor: string;

        if (edge.type === 'wikilink') {
          // Direct links — stronger, themed
          edgeAlpha = dark ? 0.5 : 0.35;
          lineWidth = 1.5;
          strokeColor = dark
            ? `rgba(180, 180, 220, ${edgeAlpha})`
            : `rgba(80, 80, 120, ${edgeAlpha})`;
        } else {
          // Tag edges — colored by first shared tag, thinner
          edgeAlpha = dark ? 0.35 : 0.25;
          lineWidth = 0.8;
          const tag = edge.shared?.[0];
          if (tag && TAG_COLORS[tag]) {
            strokeColor = hslToString(TAG_COLORS[tag], edgeAlpha);
          } else {
            strokeColor = dark
              ? `rgba(150, 150, 180, ${edgeAlpha})`
              : `rgba(100, 100, 140, ${edgeAlpha})`;
          }
        }

        // Dim edges not connected to hovered node
        if (hovered) {
          const connected = edge.source === hovered.id || edge.target === hovered.id;
          if (connected) {
            edgeAlpha = Math.min(edgeAlpha * 2.5, 0.9);
            lineWidth *= 1.5;
          } else {
            edgeAlpha = 0.03;
          }
          // Recompute color with new alpha
          if (edge.type === 'wikilink') {
            strokeColor = dark
              ? `rgba(180, 180, 220, ${edgeAlpha})`
              : `rgba(80, 80, 120, ${edgeAlpha})`;
          } else {
            const tag = edge.shared?.[0];
            if (tag && TAG_COLORS[tag]) {
              strokeColor = hslToString(TAG_COLORS[tag], edgeAlpha);
            } else {
              strokeColor = dark
                ? `rgba(150, 150, 180, ${edgeAlpha})`
                : `rgba(100, 100, 140, ${edgeAlpha})`;
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // ─── Nodes (stars) ─────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const hex = STAR_COLORS[node.category] || (dark ? '#aaaaaa' : '#666666');
        const [cr, cg, cb] = hexToRgb(hex);
        const twinkle = 0.7 + 0.3 * Math.sin(time * 1.5 + twinkleRef.current[i] * 6);

        let opacity = twinkle;
        let scale = 1;

        if (hovered) {
          if (node.id === hovered.id) {
            opacity = 1;
            scale = 1.6;
          } else if (
            filteredEdges.some(
              (e) =>
                (e.source === hovered.id && e.target === node.id) ||
                (e.target === hovered.id && e.source === node.id)
            )
          ) {
            opacity = 1;
            scale = 1.2;
          } else {
            opacity = 0.12;
          }
        }

        if (draggedNode && node.id === draggedNode.id) {
          opacity = 1;
          scale = 1.8;
        }

        const r = node.radius * scale;

        // Glow
        const glowR = r * 5;
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
        glow.addColorStop(0, `rgba(${cr},${cg},${cb},${opacity * 0.25})`);
        glow.addColorStop(0.4, `rgba(${cr},${cg},${cb},${opacity * 0.06})`);
        glow.addColorStop(1, dark ? 'rgba(18,18,18,0)' : 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Solid dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${opacity})`;
        ctx.fill();

        // Bright center
        const centerBright = dark ? 255 : 255;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(r * 0.3, 1.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${centerBright},${centerBright},${centerBright},${opacity * 0.85})`;
        ctx.fill();

        // Title label for hovered/dragged
        if ((hovered?.id === node.id || draggedNode?.id === node.id) && cam.zoom > 0.5) {
          ctx.fillStyle = dark ? 'rgba(224,224,224,0.9)' : 'rgba(68,68,68,0.9)';
          ctx.font = `${11 / cam.zoom}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x, node.y - r - 8 / cam.zoom);
        }
      }

      ctx.restore();
      frameCount++;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [showWikilinks, showTags]);

  // ─── Mouse handlers ───────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const draggedNode = draggedNodeRef.current;

    if (draggedNode) {
      const { wx, wy } = screenToWorld(e.clientX, e.clientY);
      draggedNode.x = wx;
      draggedNode.y = wy;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      return;
    }

    if (panRef.current) {
      const cam = cameraRef.current;
      cam.x = panRef.current.camX + (e.clientX - panRef.current.startX) / cam.zoom;
      cam.y = panRef.current.camY + (e.clientY - panRef.current.startY) / cam.zoom;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      return;
    }

    const node = getNodeAt(e.clientX, e.clientY);
    hoveredRef.current = node;

    if (canvasRef.current) {
      canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
    }

    const tooltip = tooltipRef.current;
    if (tooltip) {
      if (node) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left + 14}px`;
          tooltip.style.top = `${e.clientY - rect.top - 12}px`;
          tooltip.textContent = node.title;
        }
      } else {
        tooltip.style.display = 'none';
      }
    }
  }, [getNodeAt, screenToWorld]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    const node = getNodeAt(e.clientX, e.clientY);

    if (node) {
      draggedNodeRef.current = node;
      node.pinned = true;
      hoveredRef.current = node;
    } else {
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
      };
    }
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const downPos = mouseDownPosRef.current;
    const wasDraggingNode = draggedNodeRef.current;

    if (wasDraggingNode) {
      wasDraggingNode.pinned = false;
    }
    draggedNodeRef.current = null;
    panRef.current = null;
    mouseDownPosRef.current = null;

    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredRef.current ? 'pointer' : 'grab';
    }

    if (downPos) {
      const dx = Math.abs(e.clientX - downPos.x);
      const dy = Math.abs(e.clientY - downPos.y);
      if (dx < 5 && dy < 5) {
        const node = wasDraggingNode || getNodeAt(e.clientX, e.clientY);
        if (node) navigate(`/post/${node.id}`);
      }
    }
  }, [getNodeAt, navigate]);

  const handleMouseLeave = useCallback(() => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.pinned = false;
    }
    hoveredRef.current = null;
    draggedNodeRef.current = null;
    panRef.current = null;
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
  }, []);

  // ─── Wheel zoom ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      cam.zoom = Math.max(0.2, Math.min(6, cam.zoom * factor));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ─── Touch support ────────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number; dist?: number; node?: GraphNode | null } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const node = getNodeAt(e.touches[0].clientX, e.touches[0].clientY);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, node };
      if (node) {
        draggedNodeRef.current = node;
        node.pinned = true;
        hoveredRef.current = node;
      } else {
        panRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          camX: cameraRef.current.x,
          camY: cameraRef.current.y,
        };
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
      if (draggedNodeRef.current) draggedNodeRef.current.pinned = false;
      draggedNodeRef.current = null;
      panRef.current = null;
    }
  }, [getNodeAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      if (draggedNodeRef.current) {
        const { wx, wy } = screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
        draggedNodeRef.current.x = wx;
        draggedNodeRef.current.y = wy;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
      } else if (panRef.current) {
        const cam = cameraRef.current;
        cam.x = panRef.current.camX + (e.touches[0].clientX - panRef.current.startX) / cam.zoom;
        cam.y = panRef.current.camY + (e.touches[0].clientY - panRef.current.startY) / cam.zoom;
      }
    } else if (e.touches.length === 2 && touchStartRef.current?.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / touchStartRef.current.dist;
      cameraRef.current.zoom = Math.max(0.2, Math.min(6, cameraRef.current.zoom * scale));
      touchStartRef.current.dist = newDist;
    }
  }, [screenToWorld]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      if (dx < 10 && dy < 10) {
        const node = touchStartRef.current.node || getNodeAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (node) navigate(`/post/${node.id}`);
      }
    }
    if (draggedNodeRef.current) draggedNodeRef.current.pinned = false;
    draggedNodeRef.current = null;
    panRef.current = null;
    hoveredRef.current = null;
    touchStartRef.current = null;
  }, [getNodeAt, navigate]);

  // Legend colors
  const panelBg = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const panelText = isDark ? '#aaa' : '#666';
  const panelHeading = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
  const panelMuted = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const tooltipBg = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
  const tooltipText = isDark ? '#e0e0e0' : '#333';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const statsBg = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const statsText = isDark ? '#888' : '#999';

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ background: isDark ? '#121212' : '#ffffff' }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab' }}
        />
        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            display: 'none',
            background: tooltipBg,
            color: tooltipText,
            border: `1px solid ${tooltipBorder}`,
            backdropFilter: 'blur(8px)',
            maxWidth: '280px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 10,
          }}
        />
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 px-4 py-3 rounded-xl text-xs space-y-2"
        style={{
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          backdropFilter: 'blur(8px)',
          color: panelText,
        }}
      >
        <div className="font-semibold mb-2" style={{ color: panelHeading }}>Connections</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showWikilinks}
            onChange={() => setShowWikilinks(!showWikilinks)}
          />
          <span className="inline-block w-6 border-t" style={{ borderColor: isDark ? 'rgba(180,180,220,0.5)' : 'rgba(80,80,120,0.35)' }} />
          <span>Links ({graphData.edges.filter(e => e.type === 'wikilink').length})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTags}
            onChange={() => setShowTags(!showTags)}
          />
          <span className="inline-block w-6 border-t" style={{ borderColor: isDark ? 'rgba(150,150,180,0.35)' : 'rgba(100,100,140,0.25)' }} />
          <span>Shared Tags ({graphData.edges.filter(e => e.type === 'tag').length})</span>
        </label>

        <div className="border-t pt-2 mt-2" style={{ borderColor: panelBorder }}>
          <div className="font-semibold mb-1" style={{ color: panelHeading }}>Categories</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(STAR_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="capitalize">{cat === 'cool-shit' ? 'Cool Shit' : cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2" style={{ borderColor: panelBorder, color: panelMuted }}>
          Drag nodes · Scroll to zoom · Drag space to pan
        </div>
      </div>

      {/* Stats */}
      <div
        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs"
        style={{
          background: statsBg,
          color: statsText,
          border: `1px solid ${panelBorder}`,
        }}
      >
        {graphData.nodes.length} posts · {graphData.edges.length} connections
      </div>
    </div>
  );
}
