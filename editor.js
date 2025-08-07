document.addEventListener('DOMContentLoaded', () => {
    const nodeCanvas = document.getElementById('node-canvas');
    const addNodeBtn = document.getElementById('add-node-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');

    let nodes = [];
    let nodeIdCounter = 0; // Simple counter for unique IDs
    let selectedNode = null; // Track the currently selected node
    let connections = []; // Store connections between nodes

    let draggedNode = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Connection state
    let isConnecting = false;
    let connectionStart = null;

    // Function to render all nodes on the canvas
    function renderNodes() {
        nodeCanvas.innerHTML = ''; // Clear canvas

        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.classList.add('node');
            nodeEl.setAttribute('data-type', node.type);
            if (selectedNode && selectedNode.id === node.id) {
                nodeEl.classList.add('selected');
            }
            nodeEl.id = node.id;
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
            
            // Create node content
            const nodeContent = document.createElement('div');
            nodeContent.classList.add('node-content');
            nodeContent.textContent = node.name;
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('node-delete-btn');
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete node';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent node selection
                deleteNode(node.id);
            });
            
            // Create connection points
            const outputPoint = document.createElement('div');
            outputPoint.classList.add('connection-point', 'output');
            outputPoint.title = 'Output connection';
            outputPoint.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startConnection(node.id, 'output');
            });
            
            const inputPoint = document.createElement('div');
            inputPoint.classList.add('connection-point', 'input');
            inputPoint.title = 'Input connection';
            inputPoint.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (isConnecting && connectionStart) {
                    finishConnection(node.id, 'input');
                }
            });
            
            nodeEl.appendChild(nodeContent);
            nodeEl.appendChild(deleteBtn);
            nodeEl.appendChild(outputPoint);
            nodeEl.appendChild(inputPoint);
            nodeCanvas.appendChild(nodeEl);
        });
        
        renderConnections();
        updateInspector();
    }

    // Connection functionality
    function startConnection(nodeId, pointType) {
        isConnecting = true;
        connectionStart = { nodeId, pointType };
        nodeCanvas.style.cursor = 'crosshair';
        // Prevent text selection during connection creation
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }
    
    function finishConnection(nodeId, pointType) {
        if (!isConnecting || !connectionStart) return;
        
        if (connectionStart.nodeId !== nodeId) {
            // Create connection
            const newConnection = {
                id: `conn-${Date.now()}`,
                from: connectionStart.nodeId,
                to: nodeId,
                fromType: connectionStart.pointType,
                toType: pointType
            };
            connections.push(newConnection);
        }
        
        isConnecting = false;
        connectionStart = null;
        nodeCanvas.style.cursor = '';
        // Restore text selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        renderNodes();
    }
    
    function renderConnections() {
        // Remove existing SVG if any
        const existingSvg = nodeCanvas.querySelector('.connections-svg');
        if (existingSvg) {
            existingSvg.remove();
        }
        
        if (connections.length === 0) return;
        
        // Create SVG for connections
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connections-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';
        
        connections.forEach(connection => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return;
            
            // Calculate connection points to match actual connection point positions
            // Output point: node right edge + connection point offset
            const fromX = fromNode.x + 150 + 6; // Right edge of node + 6px (connection point center)
            const fromY = fromNode.y + 40; // Middle of node (50% of 80px height)
            // Input point: node left edge - connection point offset  
            const toX = toNode.x - 6; // Left edge of node - 6px (connection point center)
            const toY = toNode.y + 40; // Middle of node (50% of 80px height)
            
            // Create path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${fromX} ${fromY} C ${fromX + 50} ${fromY} ${toX - 50} ${toY} ${toX} ${toY}`;
            path.setAttribute('d', d);
            path.setAttribute('stroke', '#007bff');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            
            svg.appendChild(path);
        });
        
        // Add arrowhead marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#007bff');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        
        nodeCanvas.appendChild(svg);
    }

    // Node selection functionality
    function selectNode(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            selectedNode = node;
            renderNodes(); // Re-render to show selection
        }
    }
    
    // Node deletion functionality
    function deleteNode(nodeId) {
        const nodeIndex = nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            if (selectedNode && selectedNode.id === nodeId) {
                selectedNode = null; // Clear selection if deleted node was selected
            }
            
            // Remove connections associated with this node
            connections = connections.filter(conn => 
                conn.from !== nodeId && conn.to !== nodeId
            );
            
            nodes.splice(nodeIndex, 1);
            renderNodes();
        }
    }
    
    // Update inspector panel with selected node data
    function updateInspector() {
        const inspector = document.getElementById('inspector');
        
        if (!selectedNode) {
            inspector.innerHTML = '<h2>Node Inspector</h2><p>Select a node to edit its properties</p>';
            return;
        }
        
        inspector.innerHTML = `
            <h2>Node Inspector</h2>
            <div class="inspector-section">
                <label for="node-name">Name:</label>
                <input type="text" id="node-name" value="${selectedNode.name}" />
            </div>
            <div class="inspector-section">
                <label for="node-type">Type:</label>
                <select id="node-type">
                    <option value="default" ${selectedNode.type === 'default' ? 'selected' : ''}>Default</option>
                    <option value="input" ${selectedNode.type === 'input' ? 'selected' : ''}>Input</option>
                    <option value="output" ${selectedNode.type === 'output' ? 'selected' : ''}>Output</option>
                    <option value="processing" ${selectedNode.type === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="llm" ${selectedNode.type === 'llm' ? 'selected' : ''}>LLM</option>
                </select>
            </div>
            <div class="inspector-section">
                <label for="node-description">Description:</label>
                <textarea id="node-description" rows="3">${selectedNode.properties.description}</textarea>
            </div>
            <div class="inspector-section">
                <button id="delete-selected-btn" class="danger-btn">Delete Node</button>
            </div>
        `;
        
        // Add event listeners for inspector controls
        document.getElementById('node-name').addEventListener('input', (e) => {
            selectedNode.name = e.target.value;
            // Update only the node content without full re-render to preserve focus
            const nodeElement = document.getElementById(selectedNode.id);
            if (nodeElement) {
                const nodeContent = nodeElement.querySelector('.node-content');
                if (nodeContent) {
                    nodeContent.textContent = selectedNode.name;
                }
            }
        });
        
        document.getElementById('node-type').addEventListener('change', (e) => {
            selectedNode.type = e.target.value;
            renderNodes(); // Update the node display
        });
        
        document.getElementById('node-description').addEventListener('input', (e) => {
            selectedNode.properties.description = e.target.value;
        });
        
        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            deleteNode(selectedNode.id);
        });
    }
    
    // Save/Load functionality
    function saveProject() {
        const projectData = {
            nodes: nodes,
            connections: connections,
            nodeIdCounter: nodeIdCounter,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('llm4-project', JSON.stringify(projectData));
            alert('Project saved successfully!');
        } catch (error) {
            alert('Error saving project: ' + error.message);
        }
    }
    
    function loadProject() {
        try {
            const savedData = localStorage.getItem('llm4-project');
            if (!savedData) {
                alert('No saved project found.');
                return;
            }
            
            const projectData = JSON.parse(savedData);
            nodes = projectData.nodes || [];
            connections = projectData.connections || [];
            nodeIdCounter = projectData.nodeIdCounter || 0;
            selectedNode = null; // Clear selection
            
            renderNodes();
            alert('Project loaded successfully!');
        } catch (error) {
            alert('Error loading project: ' + error.message);
        }
    }
    
    // Auto-save functionality (optional)
    function autoSave() {
        if (nodes.length > 0) {
            const projectData = {
                nodes: nodes,
                connections: connections,
                nodeIdCounter: nodeIdCounter,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('llm4-autosave', JSON.stringify(projectData));
        }
    }
    
    // Auto-save every 30 seconds
    setInterval(autoSave, 30000);

    addNodeBtn.addEventListener('click', () => {
        nodeIdCounter++;
        const newNode = {
            id: `node-${nodeIdCounter}`,
            name: `Node ${nodeIdCounter}`,
            x: 50 + (nodes.length % 3) * 180, // Space nodes horizontally by 180px
            y: 50 + (Math.floor(nodes.length / 3)) * 120, // Space node rows by 120px
            type: 'default',
            properties: {
                description: '',
                color: '#ffffff'
            }
        };
        nodes.push(newNode);
        renderNodes();
    });
    
    // Save/Load button event listeners
    saveBtn.addEventListener('click', saveProject);
    loadBtn.addEventListener('click', loadProject);

    // Drag and Drop Functionality with Node Selection
    nodeCanvas.addEventListener('mousedown', (event) => {
        const targetNodeElement = event.target.closest('.node');
        if (!targetNodeElement) {
            // Clicked on empty canvas, clear selection
            selectedNode = null;
            renderNodes();
            return; 
        }

        const nodeId = targetNodeElement.id;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Check if clicking on connection point
        if (event.target.classList.contains('connection-point')) {
            return; // Let connection point handlers manage this
        }
        
        // Select the node
        selectNode(nodeId);

        draggedNode = node;
        isDragging = true;
        targetNodeElement.style.cursor = 'grabbing';
        targetNodeElement.style.zIndex = 1000; // Bring dragged node to front

        // Calculate offset from mouse click to node's top-left corner
        const nodeRect = targetNodeElement.getBoundingClientRect();
        const canvasRect = nodeCanvas.getBoundingClientRect();

        // Store offset relative to canvas, but based on node's current position
        offsetX = event.clientX - canvasRect.left - draggedNode.x;
        offsetY = event.clientY - canvasRect.top - draggedNode.y;
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging || !draggedNode) return;

        const canvasRect = nodeCanvas.getBoundingClientRect();
        // Calculate mouse position relative to the nodeCanvas
        let mouseX = event.clientX - canvasRect.left;
        let mouseY = event.clientY - canvasRect.top;

        // New position for the node's top-left corner
        let newX = mouseX - offsetX;
        let newY = mouseY - offsetY;

        // Optional: Constrain node position within canvas boundaries
        // newX = Math.max(0, Math.min(newX, canvasRect.width - draggedNodeElement.offsetWidth));
        // newY = Math.max(0, Math.min(newY, canvasRect.height - draggedNodeElement.offsetHeight));
        // Note: draggedNodeElement.offsetWidth/Height would require getting the element again.
        // For now, let's allow it to go out of bounds slightly for simplicity.

        draggedNode.x = newX;
        draggedNode.y = newY;

        renderNodes(); // Re-render all nodes (can be optimized later)
    });

    document.addEventListener('mouseup', (event) => {
        if (isDragging && draggedNode) {
            const draggedNodeElement = document.getElementById(draggedNode.id);
            if (draggedNodeElement) {
                draggedNodeElement.style.cursor = 'grab';
                draggedNodeElement.style.zIndex = ''; // Reset z-index
            }
        }
        
        // Cancel connection if clicking somewhere else
        if (isConnecting) {
            isConnecting = false;
            connectionStart = null;
            nodeCanvas.style.cursor = '';
            // Restore text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        }
        
        isDragging = false;
        draggedNode = null;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (selectedNode) {
                event.preventDefault();
                deleteNode(selectedNode.id);
            }
        }
    });

    // Initial render (if any nodes were pre-loaded, though we start empty)
    renderNodes();
});
