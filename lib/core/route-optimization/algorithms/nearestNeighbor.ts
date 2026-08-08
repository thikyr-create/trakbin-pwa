/** Stage 1: greedy nearest-neighbor over a distance/duration oracle. Indices 1..N are stops; 0 is the depot. */
export function nearestNeighborOrder(stopCount: number, dist: (a: number, b: number) => number): number[] {
  const order: number[] = [];
  const unvisited = new Set<number>();
  for (let i = 1; i <= stopCount; i++) unvisited.add(i);
  let current = 0;
  while (unvisited.size) {
    let best = -1, bestD = Infinity;
    for (const cand of unvisited) {
      const d = dist(current, cand);
      if (d < bestD) { bestD = d; best = cand; }
    }
    order.push(best);
    unvisited.delete(best);
    current = best;
  }
  return order;
}