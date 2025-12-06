document.addEventListener('DOMContentLoaded', () => {
    const graphManager = new GraphManager('network-container');

    // UI Elements
    const btnAddNode = document.getElementById('add-node-mode');
    const btnAddEdge = document.getElementById('add-edge-mode');
    const btnClear = document.getElementById('clear-graph');
    const btnRun = document.getElementById('run-algo');
    const algoSelect = document.getElementById('algorithm-select');
    const startNodeInput = document.getElementById('start-node');
    const algoStatus = document.getElementById('algo-status');
    const logsContent = document.getElementById('logs-content');
    const logsPanel = document.getElementById('logs-panel');
    const toggleLogsBtn = document.getElementById('toggle-logs');
    const algoDesc = document.getElementById('algo-description');
    const speedRange = document.getElementById('speed-range');

    let isRunning = false;

    // --- Mode Switching ---
    function setActiveMode(mode, btn) {
        if (isRunning) return;

        // Reset buttons
        [btnAddNode, btnAddEdge].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Logic
        graphManager.setMode(mode);
    }

    btnAddNode.addEventListener('click', () => setActiveMode('add-node', btnAddNode));
    btnAddEdge.addEventListener('click', () => {
        setActiveMode('add-edge', btnAddEdge);
    });

    btnClear.addEventListener('click', () => {
        if (confirm("Clear entire graph?")) {
            graphManager.clearGraph();
            clearLogs();
            graphManager.resetStyles();
        }
    });

    // --- Graph Interaction Hooks ---
    graphManager.network.on('click', function (params) {
        if (graphManager.mode === 'add-node') {
            if (params.nodes.length === 0 && params.edges.length === 0) {
                // Clicked on empty space
                const coord = params.pointer.canvas;
                const newId = graphManager.nodeIdCounter++;
                graphManager.addNode(newId, String(newId));
                graphManager.nodes.update({ id: newId, x: coord.x, y: coord.y });

                // Prompt to add edges for this new node
                setTimeout(() => {
                    console.log(`Node ${newId} added. Prompting for edges...`);
                    const connectTo = prompt(`Node ${newId} created! \n\nEnter the ID of a neighbor node to connect to (e.g. '1'):`);
                    if (connectTo) {
                        const targetId = parseInt(connectTo);
                        // Check if node exists
                        if (!isNaN(targetId) && graphManager.nodes.get(targetId)) {
                            const weight = prompt(`Enter cost for edge ${newId} -> ${targetId}:`, "1");
                            if (weight) {
                                graphManager.addEdge(newId, targetId, parseInt(weight));
                                logMessage(`Added edge ${newId} -> ${targetId} (Cost: ${weight})`, 'info');
                            }
                        } else {
                            if (connectTo.trim() !== "") alert("Target node ID not found!");
                        }
                    }
                }, 250);
            }
        }
    });

    // RE-INIT GraphManager with manipulation options to capture edge creation
    graphManager.network.setOptions({
        manipulation: {
            enabled: false,
            addEdge: function (data, callback) {
                // Check if user is connecting to same node
                if (data.from === data.to) {
                    callback(null);
                    return;
                }
                const weight = prompt("Enter edge cost/weight:", "1");
                if (weight != null) {
                    data.label = weight;
                    data.weight = parseInt(weight);
                    data.arrows = 'to';
                    callback(data); // Add the edge
                    // Reset mode hook if needed, but 'add-edge' stays active in UI
                    graphManager.network.addEdgeMode();
                } else {
                    callback(null);
                }
            }
        }
    });

    // --- Manual Input Modal Handling ---
    const manualInputBtn = document.getElementById('manual-input-btn');
    const inputModal = document.getElementById('input-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const generateGraphBtn = document.getElementById('generate-graph-btn');
    const nodeCountInput = document.getElementById('node-count-input');
    const edgeInputArea = document.getElementById('edge-input-area');

    function toggleModal(show) {
        if (show) {
            inputModal.classList.remove('hidden');
        } else {
            inputModal.classList.add('hidden');
        }
    }

    manualInputBtn.addEventListener('click', () => toggleModal(true));
    closeModalBtn.addEventListener('click', () => toggleModal(false));

    // Close on click outside
    inputModal.addEventListener('click', (e) => {
        if (e.target === inputModal) toggleModal(false);
    });

    generateGraphBtn.addEventListener('click', () => {
        const nodeCount = parseInt(nodeCountInput.value);
        const edgeText = edgeInputArea.value.trim();

        if (isNaN(nodeCount) || nodeCount < 2) {
            alert("Please enter a valid number of nodes (min 2).");
            return;
        }

        // 1. Clear existing graph
        graphManager.clearGraph();
        clearLogs();

        // 2. Create Nodes
        const centerX = 0;
        const centerY = 0;
        const radius = 150;

        for (let i = 1; i <= nodeCount; i++) {
            const angle = (2 * Math.PI * (i - 1)) / nodeCount;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            graphManager.addNode(i, String(i));
            graphManager.nodes.update({ id: i, x: x, y: y });
        }
        graphManager.nodeIdCounter = nodeCount + 1;

        // 3. Create Edges
        if (edgeText) {
            const lines = edgeText.split('\n');
            for (let line of lines) {
                line = line.trim();
                const parts = line.split(/[\s,]+/);
                if (parts.length >= 3) {
                    const u = parseInt(parts[0]);
                    const v = parseInt(parts[1]);
                    const w = parseInt(parts[2]);

                    if (!isNaN(u) && !isNaN(v) && !isNaN(w)) {
                        graphManager.addEdge(u, v, w);
                    }
                }
            }
        }

        toggleModal(false);
        logMessage(`Generated graph with ${nodeCount} nodes.`, 'info');
        graphManager.network.fit();

        // Reset mode to ensure UI and clean state
        setActiveMode('add-node', btnAddNode);
    });

    // --- Algorithm Execution ---
    btnRun.addEventListener('click', async () => {
        if (isRunning) return;

        const algoName = algoSelect.value;
        const startNode = startNodeInput.value || "1";

        // Reset visual state
        graphManager.resetStyles();
        clearLogs();

        // Generator
        let generator;
        switch (algoName) {
            case 'dijkstra':
                generator = Algorithms.dijkstra(graphManager, startNode);
                updateDescription("Dijkstra's Algorithm: Finds the shortest path from a source node to all other nodes.");
                break;
            case 'bellman':
                generator = Algorithms.bellmanFord(graphManager, startNode);
                updateDescription("Bellman-Ford: Handles negative weights, relaxes edges V-1 times.");
                break;
            case 'link-state':
                generator = Algorithms.linkState(graphManager, startNode);
                updateDescription("Link State: Floods information to build a map, then runs Dijkstra.");
                break;
            case 'distance-vector':
                generator = Algorithms.distanceVector(graphManager, startNode);
                updateDescription("Distance Vector: Iterative distributed algorithm (simulated).");
                break;
        }

        if (!generator) return;

        isRunning = true;
        btnRun.disabled = true;
        algoStatus.textContent = "Running...";

        for (let step of generator) {
            if (!isRunning) break;

            // Process step
            processStep(step);

            // Wait
            await new Promise(r => setTimeout(r, 1000 - (speedRange.value * 9)));
        }

        isRunning = false;
        btnRun.disabled = false;
        algoStatus.textContent = "Completed.";
    });

    function processStep(step) {
        logMessage(step.message, step.type);

        if (step.highlightNodes) {
            step.highlightNodes.forEach(nid => {
                graphManager.updateNodeColor(nid, '#f59e0b', '#fff');
            });
        }

        if (step.highlightEdges) {
            step.highlightEdges.forEach(eid => {
                graphManager.updateEdgeColor(eid, '#f59e0b');
            });
        }

        if (step.type === 'finished' && step.data.distances && step.data.previous) {
            displayRoutingTable(step.data.distances, step.data.previous);
        }
    }

    function logMessage(msg, type) {
        const div = document.createElement('div');
        div.className = `log-entry ${type === 'update' ? 'highlight' : ''} ${type === 'error' ? 'error' : ''}`;
        div.textContent = `> ${msg}`;
        logsContent.appendChild(div);
        logsContent.scrollTop = logsContent.scrollHeight;
    }

    function displayRoutingTable(distances, previous) {
        const tableContainer = document.createElement('div');
        tableContainer.style.marginTop = '1rem';
        tableContainer.innerHTML = `<h4>Final Routing Table</h4>`;

        const table = document.createElement('table');
        table.className = 'log-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr><th>Destination</th><th>Cost</th><th>Prev Hop</th></tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (const [node, dist] of Object.entries(distances)) {
            const tr = document.createElement('tr');
            const prev = previous[node] !== null ? previous[node] : '-';
            const costStr = dist === Infinity ? '∞' : dist;
            tr.innerHTML = `<td>${node}</td><td>${costStr}</td><td>${prev}</td>`;
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        tableContainer.appendChild(table);

        const spacer = document.createElement('div');
        spacer.style.borderTop = '1px solid #334155';
        spacer.style.margin = '1rem 0';
        logsContent.appendChild(spacer);
        logsContent.appendChild(tableContainer);
        logsContent.scrollTop = logsContent.scrollHeight;
    }

    function clearLogs() {
        logsContent.innerHTML = '';
        logMessage("Ready.", "info");
    }

    function updateDescription(text) {
        algoDesc.textContent = text;
    }

    // Toggle Logs
    toggleLogsBtn.addEventListener('click', () => {
        if (logsPanel.style.transform === 'translateY(80%)') {
            logsPanel.style.transform = 'translateY(0)';
            toggleLogsBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        } else {
            logsPanel.style.transform = 'translateY(80%)';
            toggleLogsBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        }
    });

    // Initial logs
    clearLogs();
});
