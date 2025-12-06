/**
 * Manages the Vis.js network instance and UI interactions for the graph.
 */
class GraphManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.nodes = new vis.DataSet([]);
        this.edges = new vis.DataSet([]);

        this.network = null;
        this.options = {
            nodes: {
                shape: 'circle',
                size: 30,
                font: {
                    size: 20,
                    color: '#ffffff', // White text inside
                    face: 'sans-serif',
                    bold: true,
                    strokeWidth: 0 // Clean text
                },
                borderWidth: 2,
                color: {
                    background: '#3b82f6', // Bright Blue
                    border: '#ffffff',
                    highlight: {
                        background: '#e11d48', // Pink/Red highlight
                        border: '#ffffff'
                    }
                },
                shadow: true,
                scaling: {
                    label: { enabled: true }
                }
            },
            edges: {
                width: 3,
                color: {
                    color: '#94a3b8',
                    highlight: '#f43f5e',
                    hover: '#cbd5e1'
                },
                arrows: {
                    to: { enabled: true, scaleFactor: 1 }
                },
                smooth: {
                    enabled: false // STRICTLY STRAIGHT LINES
                },
                font: {
                    size: 16,
                    align: 'horizontal',
                    color: '#f8fafc',
                    strokeWidth: 0,
                    strokeColor: '#0f172a',
                    background: '#1e293b' // Dark background for readability
                }
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -200,
                    centralGravity: 0.005,
                    springLength: 350,
                    springConstant: 0.02,
                    damping: 0.95,
                    avoidOverlap: 1
                },
                stabilization: {
                    enabled: true,
                    iterations: 1000,
                    fit: true,
                    updateInterval: 50
                }
            },
            interaction: {
                hover: true,
                dragNodes: true,
                zoomView: true,
                dragView: true,
                selectConnectedEdges: false,
                multiselect: false
            },
            manipulation: {
                enabled: false
            }
        };

        this.initNetwork();
        this.mode = 'add-node';
        this.nodeIdCounter = 6;
    }

    initNetwork() {
        const data = {
            nodes: this.nodes,
            edges: this.edges
        };
        this.network = new vis.Network(this.container, data, this.options);

        // Add default sample graph
        this.addNode(1, "1");
        this.addNode(2, "2");
        this.addNode(3, "3");
        this.addNode(4, "4");
        this.addNode(5, "5");

        this.addEdge(1, 2, 4);
        this.addEdge(1, 3, 2);
        this.addEdge(2, 3, 1);
        this.addEdge(2, 4, 5);
        this.addEdge(3, 4, 8);
        this.addEdge(3, 5, 10);
        this.addEdge(4, 5, 2);
    }

    setMode(mode) {
        this.mode = mode;
        this.network.disableEditMode();
        if (mode === 'add-edge') {
            this.network.addEdgeMode();
        }
    }

    addNode(id, label) {
        try {
            if (this.nodes.get(id)) return;
            this.nodes.add({ id: id, label: String(label || id), font: { color: '#ffffff' } });
        } catch (e) { console.error(e); }
    }

    addEdge(from, to, weight) {
        try {
            const edgeId = `${from}-${to}`;
            if (this.edges.get(edgeId)) return;

            this.edges.add({
                id: edgeId,
                from: from,
                to: to,
                label: String(weight),
                weight: parseInt(weight)
            });
        } catch (e) { console.error(e); }
    }

    updateEdgeColor(id, color) {
        try {
            this.edges.update({ id: id, color: { color: color } });
        } catch (e) { }
    }

    updateNodeColor(id, background, border) {
        try {
            this.nodes.update({
                id: id,
                color: {
                    background: background,
                    border: border
                }
            });
        } catch (e) { }
    }

    resetStyles() {
        const defaultNodeColor = this.options.nodes.color.background;
        const defaultNodeBorder = this.options.nodes.color.border;
        const defaultEdgeColor = this.options.edges.color.color;

        this.nodes.forEach(node => {
            this.updateNodeColor(node.id, defaultNodeColor, defaultNodeBorder);
        });

        this.edges.forEach(edge => {
            this.updateEdgeColor(edge.id, defaultEdgeColor);
        });
    }

    clearGraph() {
        this.nodes.clear();
        this.edges.clear();
        this.nodeIdCounter = 1;
    }

    getAdjacencyList() {
        const adj = {};
        this.nodes.forEach(node => {
            adj[node.id] = [];
        });
        this.edges.forEach(edge => {
            if (adj[edge.from]) {
                const w = (edge.weight !== undefined) ? edge.weight : parseInt(edge.label || 1);
                adj[edge.from].push({ to: edge.to, weight: w });
            }
        });
        return adj;
    }

    getData() {
        return {
            nodes: this.nodes.get(),
            edges: this.edges.get()
        };
    }
}
