# Routing Algorithms Visualizer

A premium, interactive web-based visualizer for common Computer Networks routing algorithms.

## Features

- **Interactive Graph Editor**:
  - Add nodes and edges (directed/weighted).
  - Drag nodes to rearrange the topology.
  - Delete elements.
- **Algorithms Implemented**:
  - **Dijkstra's Algorithm**: For shortest paths in non-negative weighted graphs.
  - **Bellman-Ford Algorithm**: Handles negative weights and detects negative cycles.
  - **Link State (LS)**: Simulates Link State Packet flooding and SPF calculation.
  - **Distance Vector (DV)**: Simulates the distributed iterative exchange of routing tables.
- **Visualization**:
  - Step-by-step animation of the algorithm's progress.
  - Color-coded highlighting of visited nodes and relaxed edges.
  - Detailed execution logs.
  - **Final Routing Table** generation showing Destination, Cost, and Next Hop.

## Setup & Usage

1. Open `index.html` in any modern web browser.
2. **Edit Graph**:
   - Use the buttons on the left sidebar to Add Nodes or Edges.
   - Click "Add Edge" and drag between nodes. Enter the weight when prompted.
3. **Run Algorithm**:
   - Select an algorithm from the dropdown.
   - Enter the Source Node ID (default is '1').
   - Adjust the Animation Speed slider.
   - Click "Run Visualizer".
4. **View Results**:
   - Watch the graph animation.
   - Expand the "Execution Logs" panel at the bottom to see detailed steps and the final routing table.

## Technologies

- **HTML5/CSS3**: Custom dark theme with glassmorphism.
- **JavaScript (ES6+)**: Logic and algorithm implementation.
- **Vis.js**: For network graph rendering and manipulation.
