import { writable } from "svelte/store";
import { api, type GraphData } from "$lib/services/api";

export const graphData = writable<GraphData>({ nodes: [], edges: [] });

export async function loadGraph() {
  const data = await api.links.graph();
  graphData.set(data);
}
