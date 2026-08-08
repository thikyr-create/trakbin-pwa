/** Stage 2: 2-opt segment-swap improvement. Returns stop order (depot excluded). */
export function twoOptImprove(order: number[], dist: (a: number, b: number) => number): number[] {
  let route = [0, ...order];
  const total = (r: number[]) => {
    let s = 0;
    for (let i = 0; i < r.length - 1; i++) s += dist(r[i], r[i + 1]);
    return s;
  };
  let best = total(route);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const next = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
        const t = total(next);
        if (t < best - 1e-9) { route = next; best = t; improved = true; }
      }
    }
  }
  return route.slice(1);
}