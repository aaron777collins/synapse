<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
  } from "d3-force";
  import { graphOpen } from "$lib/stores/ui";
  import { graphData, loadGraph } from "$lib/stores/graph";
  import { activeFile, openFile } from "$lib/stores/vault";

  // ---- types ----------------------------------------------------------------

  interface SimNode {
    id: string;
    title: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** Pinned position — set while dragging */
    fx: number | null;
    fy: number | null;
  }

  interface SimEdge {
    source: SimNode;
    target: SimNode;
  }

  // ---- canvas state ---------------------------------------------------------

  let canvas: HTMLCanvasElement | undefined = $state(undefined);
  let simulation: ReturnType<typeof forceSimulation> | null = null;

  // Pan + zoom transform
  let transform = $state({ x: 0, y: 0, k: 1 });

  // Interaction bookkeeping
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let dragNode: SimNode | null = null;
  let dragOffset = { x: 0, y: 0 };

  // Nodes kept in component scope so pointer events can reference them
  let nodes: SimNode[] = [];
  let edges: SimEdge[] = [];

  // ---- lifecycle ------------------------------------------------------------

  // Initialise or tear down the simulation whenever the modal opens/closes.
  // We only run this when graphOpen changes to avoid re-triggering on every render.
  $effect(() => {
    if ($graphOpen) {
      // Run async setup but don't await — errors surface in console
      void initGraph();
    } else {
      teardown();
    }
  });

  async function initGraph() {
    await loadGraph();

    const data = $graphData;

    nodes = data.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      x: Math.random() * 600 - 300,
      y: Math.random() * 600 - 300,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    }));

    const nodeById = new Map<string, SimNode>(nodes.map((n) => [n.id, n]));

    edges = data.edges
      .map((e) => {
        const source = nodeById.get(e.source);
        const target = nodeById.get(e.target);
        if (!source || !target) return null;
        return { source, target } as SimEdge;
      })
      .filter((e): e is SimEdge => e !== null);

    if (!canvas) return;
    const w = canvas.offsetWidth || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;

    // Centre the initial view
    transform = { x: w / 2, y: h / 2, k: 1 };

    simulation = forceSimulation(nodes as never[])
      .force(
        "link",
        forceLink(edges as never[])
          .id((d: unknown) => (d as SimNode).id)
          .distance(100)
          .strength(0.3)
      )
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(30))
      .on("tick", draw);

    draw();
  }

  function teardown() {
    if (simulation) {
      simulation.stop();
      simulation = null;
    }
  }

  // ---- rendering ------------------------------------------------------------

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim() || "#444";
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#7c6af7";
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text")
      .trim() || "#e0e0e0";
    const mutedColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-muted")
      .trim() || "#888";

    // Draw edges
    ctx.beginPath();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (const edge of edges) {
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
    }
    ctx.stroke();

    // Draw nodes
    const active = $activeFile;
    for (const node of nodes) {
      const isActive = node.id === active;
      const radius = isActive ? 8 : 5;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? accentColor : mutedColor;
      ctx.fill();
    }

    // Draw labels only when zoomed in enough
    if (transform.k > 0.5) {
      ctx.font = `${11 / transform.k}px sans-serif`;
      ctx.textAlign = "center";
      for (const node of nodes) {
        const isActive = node.id === active;
        ctx.fillStyle = isActive ? accentColor : textColor;
        ctx.fillText(node.title, node.x, node.y + (isActive ? 8 : 5) + 12 / transform.k);
      }
    }

    ctx.restore();
  }

  // ---- canvas sizing --------------------------------------------------------

  function syncCanvasSize() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function handleResize() {
    syncCanvasSize();
  }

  $effect(() => {
    if (!canvas) return;
    window.addEventListener("resize", handleResize);
    syncCanvasSize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  // ---- pointer / wheel events -----------------------------------------------

  function canvasToWorld(cx: number, cy: number) {
    return {
      x: (cx - transform.x) / transform.k,
      y: (cy - transform.y) / transform.k,
    };
  }

  function nodeAt(wx: number, wy: number): SimNode | null {
    // Hit-test in world coordinates; pick the topmost node within radius
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = n.id === $activeFile ? 8 : 5;
      const dist = Math.hypot(n.x - wx, n.y - wy);
      if (dist <= r + 4) return n;
    }
    return null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.min(5, Math.max(0.1, transform.k * delta));
    // Zoom towards the cursor position
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    transform = {
      x: mx - (mx - transform.x) * (newK / transform.k),
      y: my - (my - transform.y) * (newK / transform.k),
      k: newK,
    };
    draw();
  }

  function handleMouseDown(e: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = canvasToWorld(cx, cy);
    const hit = nodeAt(world.x, world.y);

    if (hit) {
      dragNode = hit;
      dragOffset = { x: world.x - hit.x, y: world.y - hit.y };
      // Pin the node so the simulation doesn't pull it away
      hit.fx = hit.x;
      hit.fy = hit.y;
    } else {
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas) return;
    if (dragNode) {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const world = canvasToWorld(cx, cy);
      dragNode.fx = world.x - dragOffset.x;
      dragNode.fy = world.y - dragOffset.y;
      dragNode.x = dragNode.fx;
      dragNode.y = dragNode.fy;
      simulation?.alpha(0.1).restart();
      draw();
    } else if (isPanning) {
      transform = {
        ...transform,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };
      draw();
    }
  }

  function handleMouseUp() {
    if (dragNode) {
      // Release the pin so the simulation can continue settling
      dragNode.fx = null;
      dragNode.fy = null;
      dragNode = null;
    }
    isPanning = false;
  }

  function handleDblClick(e: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = canvasToWorld(cx, cy);
    const hit = nodeAt(world.x, world.y);
    if (hit) {
      openFile(hit.id);
      graphOpen.set(false);
    }
  }

  // ---- cleanup --------------------------------------------------------------

  onDestroy(() => {
    teardown();
  });
</script>

{#if $graphOpen}
  <div
    class="fixed inset-0 z-50 flex flex-col"
    style="background: var(--bg);"
  >
    <!-- Close button -->
    <button
      onclick={() => graphOpen.set(false)}
      class="absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors"
      style="background: var(--surface); border: 1px solid var(--border); color: var(--text);"
      aria-label="Close graph view"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <!-- Canvas fills the overlay -->
    <canvas
      bind:this={canvas}
      class="flex-1 w-full"
      onwheel={handleWheel}
      onmousedown={handleMouseDown}
      onmousemove={handleMouseMove}
      onmouseup={handleMouseUp}
      onmouseleave={handleMouseUp}
      ondblclick={handleDblClick}
    ></canvas>
  </div>
{/if}
