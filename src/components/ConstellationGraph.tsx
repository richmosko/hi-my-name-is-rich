import { useEffect, useRef, useCallback } from 'react';
import graphData from '../lib/graph-index.json';
import { useTheme } from '../hooks/useTheme';
import {
  useConstellationState, getConstellationState,
  setZoom, setActive, setNodeCount, setEdgeCount, setWikilinkCount, setTagCount,
} from '../stores/constellation';
import {
  type GraphNode,
  type GraphEdge,
  type ForceMultipliers,
  initializePositions,
  computeNodeMetrics,
  tick,
} from '../lib/forceLayout';

// Category → star color
const STAR_COLORS: Record<string, string> = {
  travel: '#34d399',
  design: '#c084fc',
  finance: '#fbbf24',
  projects: '#38bdf8',
  musings: '#fb7185',
  'cool-shit': '#fb923c',
  food: '#a3e635',
};

function generateTagColors(edges: typeof graphData.edges): Record<string, string> {
  const tags = new Set<string>();
  edges.forEach((e) => { if (e.type === 'tag' && e.shared) e.shared.forEach((t) => tags.add(t)); });
  const colors: Record<string, string> = {};
  const sorted = [...tags].sort();
  sorted.forEach((tag, i) => { colors[tag] = `hsl(${(i * 137.508) % 360}, 70%, 60%)`; });
  return colors;
}

const TAG_COLORS = generateTagColors(graphData.edges);

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function hslToString(hsl: string, alpha: number): string {
  return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

export interface ConstellationGraphProps {
  /** Initial zoom level (default 1.4) */
  initialZoom?: number;
  /** Show wikilink edges (default true) */
  showWikilinks?: boolean;
  /** Show tag edges (default true) */
  showTags?: boolean;
  /** Allow interaction — pan, zoom, drag, click (default true). When false, renders as a static ambient animation */
  interactive?: boolean;
  /** CSS class for the container div */
  className?: string;
  /** Inline style for the container div */
  style?: React.CSSProperties;
}


export default function ConstellationGraph({
  initialZoom = 1.4,
  autoFit = false,
  showWikilinks = true,
  showTags = true,
  interactive = true,
  className = '',
  style,
}: ConstellationGraphProps & { autoFit?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cState = useConstellationState();
  const storeShowWikilinks = cState.showWikilinks;
  const storeShowTags = cState.showTags;
  const storeZoom = cState.zoom;
  const storeForces = cState.forces;
  const resetCounter = cState.cameraResetCounter;

  // Graph data refs
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animFrameRef = useRef<number>(0);
  const twinkleRef = useRef<number[]>([]);

  // Interaction refs
  const hoveredRef = useRef<GraphNode | null>(null);
  const lastHoveredRef = useRef<GraphNode | null>(null);
  const hoverFadeRef = useRef(0);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const panRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  // Tooltip removed — node titles are drawn on the canvas

  // Camera
  const cameraRef = useRef({ x: 0, y: 0, zoom: initialZoom });
  // Animated target camera — when set, the render loop lerps toward it
  const cameraTargetRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const sizeRef = useRef({ w: 800, h: 600 });
  const themeRef = useRef(isDark);
  themeRef.current = isDark;

  // Sync store values to refs for render loop (render loop can't call useStore)
  const showWikilinksRef = useRef(showWikilinks);
  showWikilinksRef.current = interactive ? storeShowWikilinks : showWikilinks;
  const showTagsRef = useRef(showTags);
  showTagsRef.current = interactive ? storeShowTags : showTags;
  const zoomRef = useRef(storeZoom);
  zoomRef.current = storeZoom;
  const forcesRef = useRef(storeForces);
  forcesRef.current = storeForces;

  // Animated camera reset when store counter increments
  const prevResetRef = useRef(resetCounter);
  useEffect(() => {
    if (resetCounter > prevResetRef.current) {
      prevResetRef.current = resetCounter;
      const nodes = nodesRef.current;
      const { w, h } = sizeRef.current;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); }
      const graphW = maxX - minX || 1;
      const graphH = maxY - minY || 1;
      const graphCx = (minX + maxX) / 2;
      const graphCy = (minY + maxY) / 2;
      const zoom = autoFit ? Math.min(w / graphW, h / graphH) * 0.85 : initialZoom;
      const camX = autoFit ? w / 2 - graphCx : 0;
      const camY = autoFit ? h / 2 - graphCy : 0;
      cameraTargetRef.current = { x: camX, y: camY, zoom };
    }
  }, [resetCounter, autoFit, initialZoom]);

  // Set constellation stats when interactive (full page)
  useEffect(() => {
    if (!interactive) return;
    setActive(true);
    setNodeCount(graphData.nodes.length);
    setEdgeCount(graphData.edges.length);
    setWikilinkCount(graphData.edges.filter(e => e.type === 'wikilink').length);
    setTagCount(graphData.edges.filter(e => e.type === 'tag').length);
    return () => { setActive(false); };
  }, [interactive]);

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const cam = cameraRef.current;
    return {
      wx: (clientX - rect.left - w / 2) / cam.zoom + w / 2 - cam.x,
      wy: (clientY - rect.top - h / 2) / cam.zoom + h / 2 - cam.y,
    };
  }, []);

  const getNodeAt = useCallback((clientX: number, clientY: number): GraphNode | null => {
    const { wx, wy } = screenToWorld(clientX, clientY);
    const hitRadius = 20 / cameraRef.current.zoom;
    let closest: GraphNode | null = null;
    let closestDist = Infinity;
    for (const node of nodesRef.current) {
      const dx = wx - node.x;
      const dy = wy - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius && dist < closestDist) { closest = node; closestDist = dist; }
    }
    return closest;
  }, [screenToWorld]);

  // ─── Initialize ─────────────────────────────────────────────────
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
      // Settle in a 1000x1000 frame
      initializePositions(nodes, 1000, 1000);
      let alpha = 1.0;
      for (let i = 0; i < 300; i++) { tick(nodes, edges, 1000, 1000, alpha); alpha *= 0.98; }

      if (autoFit) {
        // Shift all nodes so centroid = canvas center, then compute zoom
        let sumX = 0, sumY = 0;
        for (const n of nodes) { sumX += n.x; sumY += n.y; }
        const cx = sumX / nodes.length;
        const cy = sumY / nodes.length;
        const dx = rect.width / 2 - cx;
        const dy = rect.height / 2 - cy;
        for (const n of nodes) { n.x += dx; n.y += dy; }

        // Compute zoom from bounding box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of nodes) {
          minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
          minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
        }
        const graphW = maxX - minX || 1;
        const graphH = maxY - minY || 1;
        const zoom = Math.min(rect.width / graphW, rect.height / graphH) * 0.8;
        // Camera at (0,0) since nodes are already centered on canvas
        cameraRef.current = { x: 0, y: 0, zoom };
        setZoom(zoom);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render loop ────────────────────────────────────────────────
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

      // Smooth hover fade
      const fadeSpeed = 0.06;
      if (hovered) {
        lastHoveredRef.current = hovered;
        hoverFadeRef.current = Math.min(1, hoverFadeRef.current + fadeSpeed);
      } else {
        hoverFadeRef.current = Math.max(0, hoverFadeRef.current - fadeSpeed);
        if (hoverFadeRef.current === 0) lastHoveredRef.current = null;
      }
      const hoverFade = hoverFadeRef.current;
      const activeHover = hovered || lastHoveredRef.current;

      // Read force settings from store
      const f = forcesRef.current;
      const multipliers: ForceMultipliers = {
        linkStrength: f.linkStrength,
        tagStrength: f.tagStrength / 0.3,
        repulsion: f.repulsion,
        gravity: f.gravity / 0.1,
        drift: f.drift / 0.1,
      };

      const alpha = draggedNode ? 0.3 : 0.015;
      // Use 1000x1000 sim frame — matches init, gravity + boundary at (500,500)
      // Use canvas dimensions when autoFit shifted nodes to canvas center,
      // otherwise use sim frame (1000x1000)
      const tickW = autoFit ? w : 1000;
      const tickH = autoFit ? h : 1000;
      tick(nodes, edges, tickW, tickH, alpha, multipliers);
      if (draggedNode) { draggedNode.vx = 0; draggedNode.vy = 0; }

      // Animated camera transition (for Reset All)
      const target = cameraTargetRef.current;
      if (target) {
        const lerpSpeed = 0.06;
        cam.x += (target.x - cam.x) * lerpSpeed;
        cam.y += (target.y - cam.y) * lerpSpeed;
        cam.zoom += (target.zoom - cam.zoom) * lerpSpeed;
        // Clear target once close enough
        if (
          Math.abs(cam.x - target.x) < 0.1 &&
          Math.abs(cam.y - target.y) < 0.1 &&
          Math.abs(cam.zoom - target.zoom) < 0.005
        ) {
          cam.x = target.x;
          cam.y = target.y;
          cam.zoom = target.zoom;
          cameraTargetRef.current = null;
          // Sync final zoom to store when animation completes
          setZoom(cam.zoom);
        }
      } else {
        // Sync zoom from store (slider) → camera (no animation in progress)
        const storeZ = zoomRef.current;
        if (Math.abs(storeZ - cam.zoom) > 0.01) {
          cam.zoom = storeZ;
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = dark ? '#121212' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-w / 2 + cam.x, -h / 2 + cam.y);

      const filteredEdges = edges.filter((e) => {
        if (e.type === 'wikilink' && !showWikilinksRef.current) return false;
        if (e.type === 'tag' && !showTagsRef.current) return false;
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
          edgeAlpha = dark ? 0.5 : 0.35;
          lineWidth = 1.5;
          strokeColor = dark ? `rgba(180,180,220,${edgeAlpha})` : `rgba(80,80,120,${edgeAlpha})`;
        } else {
          edgeAlpha = dark ? 0.35 : 0.25;
          lineWidth = 0.8;
          const tag = edge.shared?.[0];
          strokeColor = (tag && TAG_COLORS[tag])
            ? hslToString(TAG_COLORS[tag], edgeAlpha)
            : dark ? `rgba(150,150,180,${edgeAlpha})` : `rgba(100,100,140,${edgeAlpha})`;
        }

        if (hoverFade > 0 && activeHover) {
          const connected = edge.source === activeHover.id || edge.target === activeHover.id;
          const targetAlpha = connected ? Math.min(edgeAlpha * 2.5, 0.9) : 0.03;
          const targetWidth = connected ? lineWidth * 1.5 : lineWidth;
          edgeAlpha = edgeAlpha + (targetAlpha - edgeAlpha) * hoverFade;
          lineWidth = lineWidth + (targetWidth - lineWidth) * hoverFade;
          if (edge.type === 'wikilink') {
            strokeColor = dark ? `rgba(180,180,220,${edgeAlpha})` : `rgba(80,80,120,${edgeAlpha})`;
          } else {
            const tag = edge.shared?.[0];
            strokeColor = (tag && TAG_COLORS[tag])
              ? hslToString(TAG_COLORS[tag], edgeAlpha)
              : dark ? `rgba(150,150,180,${edgeAlpha})` : `rgba(100,100,140,${edgeAlpha})`;
          }
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // ─── Nodes ─────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const hex = STAR_COLORS[node.category] || (dark ? '#aaaaaa' : '#666666');
        const [cr, cg, cb] = hexToRgb(hex);
        const twinkle = 0.7 + 0.3 * Math.sin(time * 1.5 + twinkleRef.current[i] * 6);

        let opacity = twinkle;
        let scale = 1;

        if (hoverFade > 0 && activeHover) {
          let tO: number, tS: number;
          if (node.id === activeHover.id) { tO = 1; tS = 1.6; }
          else if (filteredEdges.some((e) => (e.source === activeHover.id && e.target === node.id) || (e.target === activeHover.id && e.source === node.id))) { tO = 1; tS = 1.2; }
          else { tO = 0.12; tS = 1; }
          opacity = opacity + (tO - opacity) * hoverFade;
          scale = scale + (tS - scale) * hoverFade;
        }

        if (draggedNode && node.id === draggedNode.id) { opacity = 1; scale = 1.8; }

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

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(r * 0.3, 1.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity * 0.85})`;
        ctx.fill();

        if (interactive && (activeHover?.id === node.id || draggedNode?.id === node.id) && cam.zoom > 0.5) {
          ctx.fillStyle = dark ? 'rgba(224,224,224,0.9)' : 'rgba(68,68,68,0.9)';
          ctx.font = `11px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x, node.y - r - 18);
        }
      }

      // ─── Shared tags row below hovered node ──────
      if (interactive && hoverFade > 0.3 && activeHover) {
        const tagSet = new Set<string>();
        for (const edge of filteredEdges) {
          const connected = edge.source === activeHover.id || edge.target === activeHover.id;
          if (!connected || !edge.shared) continue;
          edge.shared.forEach((t) => tagSet.add(t));
        }
        const tags = Array.from(tagSet);

        if (tags.length > 0) {
          const fs = 9;
          const dotR = 2.5;
          const gap = 6;
          const nodeR = activeHover.radius * (draggedNodeRef.current?.id === activeHover.id ? 1.8 : 1.6);
          // Position just below the node title (title is at y - nodeR - 18)
          const tagY = activeHover.y - nodeR - 5;

          ctx.font = `${fs}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'left';
          ctx.globalAlpha = hoverFade * 0.85;

          // Measure total width to center the row
          let totalW = 0;
          const measurements: { tag: string; w: number }[] = [];
          for (const tag of tags) {
            const w = ctx.measureText(tag).width;
            measurements.push({ tag, w });
            totalW += dotR * 2 + gap * 0.5 + w + gap;
          }
          totalW -= gap; // remove trailing gap

          let curX = activeHover.x - totalW / 2;
          for (const { tag, w } of measurements) {
            // Colored dot
            const tagColor = TAG_COLORS[tag];
            ctx.beginPath();
            ctx.arc(curX + dotR, tagY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = tagColor
              ? hslToString(tagColor, dark ? 0.8 : 0.65)
              : dark ? 'rgba(150,150,180,0.7)' : 'rgba(100,100,140,0.6)';
            ctx.fill();
            curX += dotR * 2 + gap * 0.5;
            // Tag name
            ctx.fillStyle = dark ? 'rgba(200,200,200,0.75)' : 'rgba(80,80,80,0.7)';
            ctx.fillText(tag, curX, tagY + fs * 0.35);
            curX += w + gap;
          }

          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
      frameCount++;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // ─── Mouse handlers (only when interactive) ─────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    const draggedNode = draggedNodeRef.current;

    if (draggedNode) {
      const { wx, wy } = screenToWorld(e.clientX, e.clientY);
      draggedNode.x = wx; draggedNode.y = wy; draggedNode.vx = 0; draggedNode.vy = 0;
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
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'grab';

    // Node title is drawn on the canvas (moves with the node),
    // so no HTML tooltip needed
  }, [interactive, getNodeAt, screenToWorld]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    const node = getNodeAt(e.clientX, e.clientY);
    if (node) { draggedNodeRef.current = node; node.pinned = true; hoveredRef.current = node; }
    else { panRef.current = { startX: e.clientX, startY: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y }; }
  }, [interactive, getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    const downPos = mouseDownPosRef.current;
    const wasDragging = draggedNodeRef.current;
    if (wasDragging) wasDragging.pinned = false;
    draggedNodeRef.current = null; panRef.current = null; mouseDownPosRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = hoveredRef.current ? 'pointer' : 'grab';
    if (downPos) {
      const dx = Math.abs(e.clientX - downPos.x), dy = Math.abs(e.clientY - downPos.y);
      if (dx < 5 && dy < 5) { const node = wasDragging || getNodeAt(e.clientX, e.clientY); if (node) window.location.href = `/post/${node.id}`; }
    }
  }, [interactive, getNodeAt]);

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    if (draggedNodeRef.current) draggedNodeRef.current.pinned = false;
    hoveredRef.current = null; draggedNodeRef.current = null; panRef.current = null;
    // Clear hover state
  }, [interactive]);

  // Wheel zoom
  useEffect(() => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const newZoom = Math.max(0.2, Math.min(6, cam.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      cam.zoom = newZoom;
      // Sync to context so TopBar slider reflects wheel changes
      setZoom(newZoom);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [interactive]);

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number; dist?: number; node?: GraphNode | null } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!interactive) return;
    if (e.touches.length === 1) {
      const node = getNodeAt(e.touches[0].clientX, e.touches[0].clientY);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, node };
      if (node) { draggedNodeRef.current = node; node.pinned = true; hoveredRef.current = node; }
      else { panRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, camX: cameraRef.current.x, camY: cameraRef.current.y }; }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2, dist: Math.sqrt(dx * dx + dy * dy) };
      if (draggedNodeRef.current) draggedNodeRef.current.pinned = false;
      draggedNodeRef.current = null; panRef.current = null;
    }
  }, [interactive, getNodeAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!interactive) return;
    e.preventDefault();
    if (e.touches.length === 1) {
      if (draggedNodeRef.current) {
        const { wx, wy } = screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
        draggedNodeRef.current.x = wx; draggedNodeRef.current.y = wy; draggedNodeRef.current.vx = 0; draggedNodeRef.current.vy = 0;
      } else if (panRef.current) {
        const cam = cameraRef.current;
        cam.x = panRef.current.camX + (e.touches[0].clientX - panRef.current.startX) / cam.zoom;
        cam.y = panRef.current.camY + (e.touches[0].clientY - panRef.current.startY) / cam.zoom;
      }
    } else if (e.touches.length === 2 && touchStartRef.current?.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.max(0.2, Math.min(6, cameraRef.current.zoom * (newDist / touchStartRef.current.dist)));
      cameraRef.current.zoom = newZoom;
      setZoom(newZoom);
      touchStartRef.current.dist = newDist;
    }
  }, [interactive, screenToWorld]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!interactive) return;
    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      if (dx < 10 && dy < 10) { const node = touchStartRef.current.node || getNodeAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY); if (node) window.location.href = `/post/${node.id}`; }
    }
    if (draggedNodeRef.current) draggedNodeRef.current.pinned = false;
    draggedNodeRef.current = null; panRef.current = null; hoveredRef.current = null; touchStartRef.current = null;
  }, [interactive, getNodeAt]);


  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ background: isDark ? '#121212' : '#ffffff', ...style }}
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
        style={{ cursor: interactive ? 'grab' : 'default', touchAction: interactive ? 'none' : 'auto' }}
      />
      {/* Node titles are drawn directly on the canvas */}
    </div>
  );
}
