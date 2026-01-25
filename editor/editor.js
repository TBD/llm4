document.addEventListener('DOMContentLoaded', () => {
    const nodeCanvas = document.getElementById('node-canvas');
    const addNodeBtn = document.getElementById('add-node-btn');
    const deleteNodeBtn = document.getElementById('delete-node-btn');
    const inspector = document.getElementById('inspector');
    const inspectorToggle = document.getElementById('inspector-toggle');

    let nodes = [];
    let nodeIdCounter = 0; // Simple counter for unique IDs
    let selectedNode = null; // Track currently selected node

    let draggedNode = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Load saved nodes from localStorage on startup
    function loadNodesFromStorage() {
        try {
            const saved = localStorage.getItem('llm4-nodes');
            if (saved) {
                const data = JSON.parse(saved);
                nodes = data.nodes || [];
                nodeIdCounter = data.nodeIdCounter || 0;
                renderNodes();
            }
        } catch (e) {
            console.error('Failed to load nodes from storage:', e);
        }
    }
    
    // Save nodes to localStorage
    function saveNodesToStorage() {
        try {
            localStorage.setItem('llm4-nodes', JSON.stringify({
                nodes: nodes,
                nodeIdCounter: nodeIdCounter
            }));
        } catch (e) {
            console.error('Failed to save nodes to storage:', e);
        }
    }

    // Mobile inspector toggle functionality
    if (inspectorToggle) {
        inspectorToggle.addEventListener('click', () => {
            inspector.classList.toggle('collapsed');
            inspectorToggle.textContent = inspector.classList.contains('collapsed') ? 'ℹ' : '✕';
        });
    }

    // Function to render all nodes on the canvas
    function renderNodes() {
        // Optimize: Only update existing nodes or add new ones, don't clear everything
        nodes.forEach(node => {
            let nodeEl = document.getElementById(node.id);
            
            if (!nodeEl) {
                // Create new node if it doesn't exist
                nodeEl = document.createElement('div');
                nodeEl.classList.add('node');
                nodeEl.id = node.id;
                nodeEl.textContent = node.name;
                nodeCanvas.appendChild(nodeEl);
                
                // Add click handler for selection
                nodeEl.addEventListener('click', (e) => {
                    if (!isDragging) {
                        selectNode(node);
                        e.stopPropagation();
                    }
                });
            }
            
            // Update position (this is the only thing that changes during drag)
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
            
            // Update selection state
            if (selectedNode && selectedNode.id === node.id) {
                nodeEl.classList.add('selected');
            } else {
                nodeEl.classList.remove('selected');
            }
        });
        
        // Remove nodes that no longer exist in the nodes array
        // Optimize: Use Set for O(1) lookup instead of find() for O(n²) complexity
        const nodeIdSet = new Set(nodes.map(n => n.id));
        const nodeElements = nodeCanvas.querySelectorAll('.node');
        nodeElements.forEach(nodeEl => {
            if (!nodeIdSet.has(nodeEl.id)) {
                nodeEl.remove();
            }
        });
    }
    
    // Function to select a node and update inspector
    function selectNode(node) {
        selectedNode = node;
        renderNodes();
        updateInspector();
        updateToolbar();
    }
    
    // Function to deselect current node
    function deselectNode() {
        selectedNode = null;
        renderNodes();
        updateInspector();
        updateToolbar();
    }
    
    // Function to update toolbar buttons based on selection state
    function updateToolbar() {
        if (deleteNodeBtn) {
            deleteNodeBtn.disabled = !selectedNode;
        }
    }
    
    // Function to update inspector panel with node properties
    function updateInspector() {
        const inspectorHint = document.getElementById('inspector-hint');
        
        if (selectedNode) {
            inspectorHint.innerHTML = `
                <strong>Node ID:</strong> ${selectedNode.id}<br>
                <strong>Name:</strong> ${selectedNode.name}<br>
                <strong>Type:</strong> ${selectedNode.type}<br>
                <strong>Position:</strong> (${Math.round(selectedNode.x)}, ${Math.round(selectedNode.y)})
            `;
        } else {
            inspectorHint.textContent = 'Select a node to view its properties';
        }
    }
    
    // Function to delete selected node
    function deleteSelectedNode() {
        if (selectedNode) {
            const index = nodes.findIndex(n => n.id === selectedNode.id);
            if (index !== -1) {
                nodes.splice(index, 1);
                selectedNode = null;
                renderNodes();
                updateInspector();
                saveNodesToStorage();
            }
        }
    }

    // Add Node functionality
    addNodeBtn.addEventListener('click', () => {
        nodeIdCounter++;
        const newNode = {
            id: `node-${nodeIdCounter}`,
            name: `Node ${nodeIdCounter}`,
            x: 50 + (nodes.length % 5) * 20, // Basic positioning, slightly offset new nodes
            y: 50 + (Math.floor(nodes.length / 5)) * 20,
            type: 'default'
        };
        nodes.push(newNode);
        renderNodes();
        saveNodesToStorage();
    });
    
    // Delete Node functionality
    if (deleteNodeBtn) {
        deleteNodeBtn.addEventListener('click', () => {
            deleteSelectedNode();
        });
    }

    // Unified pointer event handling for both mouse and touch
    function handlePointerDown(event) {
        const targetNodeElement = event.target.closest('.node');
        if (!targetNodeElement) return; // Click was not on a node

        draggedNode = nodes.find(n => n.id === targetNodeElement.id);
        if (!draggedNode) return;
        
        // Select the node being dragged
        selectNode(draggedNode);

        isDragging = true;
        targetNodeElement.style.cursor = 'grabbing';
        targetNodeElement.style.zIndex = 1000; // Bring dragged node to front

        // Calculate offset from pointer to node's top-left corner
        const canvasRect = nodeCanvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        offsetX = clientX - canvasRect.left - draggedNode.x;
        offsetY = clientY - canvasRect.top - draggedNode.y;

        // Prevent scrolling on touch devices
        if (event.touches) {
            event.preventDefault();
        }
    }

    function handlePointerMove(event) {
        if (!isDragging || !draggedNode) return;

        const canvasRect = nodeCanvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        // Calculate pointer position relative to the nodeCanvas
        let pointerX = clientX - canvasRect.left;
        let pointerY = clientY - canvasRect.top;

        // New position for the node's top-left corner
        draggedNode.x = pointerX - offsetX;
        draggedNode.y = pointerY - offsetY;

        renderNodes();

        // Prevent scrolling on touch devices
        if (event.touches) {
            event.preventDefault();
        }
    }

    function handlePointerUp() {
        if (isDragging && draggedNode) {
            const draggedNodeElement = document.getElementById(draggedNode.id);
            if (draggedNodeElement) {
                draggedNodeElement.style.cursor = 'grab';
                draggedNodeElement.style.zIndex = ''; // Reset z-index
            }
            // Save position after drag
            saveNodesToStorage();
        }
        
        isDragging = false;
        draggedNode = null;
    }

    // Mouse events
    nodeCanvas.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);

    // Touch events for mobile support
    nodeCanvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
    
    // Click on canvas to deselect
    nodeCanvas.addEventListener('click', (e) => {
        if (e.target === nodeCanvas) {
            deselectNode();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't handle shortcuts if user is typing in an input field
        const isTyping = e.target.tagName === 'INPUT' || 
                        e.target.tagName === 'TEXTAREA' || 
                        e.target.isContentEditable;
        
        // Delete or Backspace to delete selected node
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !isTyping) {
            e.preventDefault();
            deleteSelectedNode();
        }
        // Escape to deselect
        if (e.key === 'Escape' && !isTyping) {
            deselectNode();
        }
    });

    // Load saved nodes and initial render
    loadNodesFromStorage();
    renderNodes();
});
