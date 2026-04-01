import { useEffect, useRef } from 'react';
import { useConstellationControls } from '../hooks/useConstellationControls';
import ConstellationGraph from '../components/ConstellationGraph';
import graphData from '../lib/graph-index.json';

export default function Constellation() {
  const controls = useConstellationControls();
  const registeredRef = useRef(false);

  // Register this page as active + provide counts (once on mount)
  useEffect(() => {
    if (!controls || registeredRef.current) return;
    registeredRef.current = true;
    controls.setActive(true);
    controls.setCounts(
      graphData.nodes.length,
      graphData.edges.length,
      graphData.edges.filter(e => e.type === 'wikilink').length,
      graphData.edges.filter(e => e.type === 'tag').length,
    );
    return () => {
      controls.setActive(false);
      registeredRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 'calc(100dvh - 65px)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}
    >
      <ConstellationGraph
        autoFit
        showWikilinks={controls?.showWikilinks ?? true}
        showTags={controls?.showTags ?? true}
        interactive
        className="w-full h-full rounded-xl"
      />
    </div>
  );
}
