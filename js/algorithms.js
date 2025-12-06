/**
 * Implementation of Dijkstra, Bellman-Ford, etc.
 * Designed to return a generator or a list of steps for visualization.
 */

const Algorithms = {
    // Utility for creating a step object
    createStep: (type, data, message, highlightNodes = [], highlightEdges = []) => {
        return { type, data, message, highlightNodes, highlightEdges };
    },

    // 1. Dijkstra's Algorithm
    dijkstra: function* (graphManager, startNodeId) {
        const adj = graphManager.getAdjacencyList();
        const nodes = graphManager.nodes.getIds();

        if (!nodes.includes(parseInt(startNodeId)) && !nodes.includes(startNodeId)) {
            yield this.createStep('error', null, `Start node ${startNodeId} not found.`);
            return;
        }

        let distances = {};
        let previous = {};
        let pq = []; // Simple priority queue (array sorted)
        let visited = new Set();

        nodes.forEach(node => {
            distances[node] = Infinity;
            previous[node] = null;
        });

        distances[startNodeId] = 0;
        pq.push({ id: startNodeId, dist: 0 });

        yield this.createStep('init', { distances }, `Initialized distances. Start node: ${startNodeId}`, [startNodeId]);

        while (pq.length > 0) {
            // Sort by distance (asc)
            pq.sort((a, b) => a.dist - b.dist);
            const { id: u, dist: d } = pq.shift(); // Pop smallest

            if (d > distances[u]) continue;
            if (visited.has(u)) continue;
            visited.add(u);

            yield this.createStep('visit', { distances }, `Visiting Node ${u} (Current Dist: ${d})`, [u]);

            const neighbors = adj[u] || [];
            for (let edge of neighbors) {
                const v = edge.to;
                const weight = edge.weight;

                // Visualization check of edge
                yield this.createStep('check', { distances }, `Checking edge ${u} -> ${v} (weight: ${weight})`, [u, v], [`${u}-${v}`]);

                if (distances[u] + weight < distances[v]) {
                    distances[v] = distances[u] + weight;
                    previous[v] = u;
                    pq.push({ id: v, dist: distances[v] });

                    yield this.createStep('update', { distances }, `Updated distance for Node ${v} to ${distances[v]}`, [v], [`${u}-${v}`]);
                }
            }
        }

        yield this.createStep('finished', { distances, previous }, "Dijkstra completed.", [], []);
    },

    // 2. Bellman-Ford
    bellmanFord: function* (graphManager, startNodeId) {
        const nodes = graphManager.nodes.getIds();
        const edges = graphManager.edges.get(); // Array of edge objects {from, to, weight...}

        if (!nodes.includes(parseInt(startNodeId)) && !nodes.includes(startNodeId)) {
            yield this.createStep('error', null, `Start node ${startNodeId} not found.`);
            return;
        }

        let distances = {};
        let previous = {};

        nodes.forEach(node => {
            distances[node] = Infinity;
            previous[node] = null;
        });
        distances[startNodeId] = 0;

        yield this.createStep('init', { distances }, "Initialized Bellman-Ford. Relaxing edges V-1 times.", [startNodeId]);

        // Relax V-1 times
        for (let i = 0; i < nodes.length - 1; i++) {
            let changed = false;
            yield this.createStep('iteration', { distances }, `Iteration ${i + 1}/${nodes.length - 1}`);

            for (let edge of edges) {
                const u = edge.from;
                const v = edge.to;
                const w = parseInt(edge.label || edge.weight);

                // Highlight edge being checked
                // active nodes u and v
                // yield this.createStep('check', { distances }, `Checking ${u}->${v}`, [u, v], [edge.id]);

                if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
                    distances[v] = distances[u] + w;
                    previous[v] = u;
                    changed = true;
                    yield this.createStep('update', { distances }, `Relaxed ${u}->${v}: New dist ${distances[v]}`, [v], [edge.id]);
                }
            }
            if (!changed) {
                yield this.createStep('info', { distances }, "No changes in this iteration, stopping early.");
                break;
            }
        }

        // Check for negative cycles
        for (let edge of edges) {
            const u = edge.from;
            const v = edge.to;
            const w = parseInt(edge.label || edge.weight);
            if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
                yield this.createStep('error', { distances }, "Negative weight cycle detected!", [u, v], [edge.id]);
                return;
            }
        }

        yield this.createStep('finished', { distances, previous }, "Bellman-Ford completed.");
    },

    // 3. Link State (Flooding + Dijkstra)
    linkState: function* (graphManager, startNodeId) {
        yield this.createStep('info', {}, "Link State: 1. Nodes Flood LSPs. 2. Build Graph. 3. Run Dijkstra.");
        // We simulate the result by running Dijkstra, as LS eventually builds the full graph and runs Dijkstra.
        yield* this.dijkstra(graphManager, startNodeId);
    },

    // 4. Distance Vector (Simulated)
    distanceVector: function* (graphManager, startNodeId) {
        const nodes = graphManager.nodes.getIds();
        const edges = graphManager.edges.get();

        if (!nodes.includes(parseInt(startNodeId)) && !nodes.includes(startNodeId)) {
            yield this.createStep('error', null, `Start node ${startNodeId} not found.`);
            return;
        }

        let distances = {};
        let previous = {}; // To track next hop

        nodes.forEach(node => {
            distances[node] = Infinity;
            previous[node] = null;
        });
        distances[startNodeId] = 0;

        yield this.createStep('init', { distances }, "Initialized Distance Vector. Nodes will exchange vectors.", [startNodeId]);

        // Simulating Rounds of Exchange
        // In DV, in each round, every node sends its vector to neighbors. Neighbors update.
        // This is effectively Relaxing all edges.

        // Max V-1 iterations for convergence in worst case without cycles
        for (let i = 0; i < nodes.length - 1; i++) {
            let changed = false;
            yield this.createStep('iteration', { distances }, `Round ${i + 1}: Exchanging Vectors...`);

            // For visualization, we iterate edges to show "messages"
            for (let edge of edges) {
                const u = edge.from;
                const v = edge.to;
                const w = parseInt(edge.label || edge.weight);

                // If u has a distance, it 'sends' it to v
                if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
                    distances[v] = distances[u] + w;
                    previous[v] = u; // For DV, Next Hop is the neighbor we got the info from
                    changed = true;
                    // Visualizing: Node u tells v that it can reach startNode with dist[u]
                    yield this.createStep('update', { distances }, `Node ${u} updates Node ${v}: New Path Cost ${distances[v]}`, [v], [edge.id]);
                }
            }

            if (!changed) {
                yield this.createStep('info', { distances }, "Convergence reached. No more updates.");
                break;
            }
        }

        yield this.createStep('finished', { distances, previous }, "Distance Vector Protocol Converged (Simulated).");
    }
};
