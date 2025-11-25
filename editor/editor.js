document.addEventListener('DOMContentLoaded', () => {
    const nodeCanvas = document.getElementById('node-canvas');
    const addNodeBtn = document.getElementById('add-node-btn');
    const inspector = document.getElementById('inspector');
    const inspectorToggle = document.getElementById('inspector-toggle');

    let nodes = [];
    let nodeIdCounter = 0; // Simple counter for unique IDs

    let draggedNode = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

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
            }
            
            // Update position (this is the only thing that changes during drag)
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
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
    });

    // Unified pointer event handling for both mouse and touch
    function handlePointerDown(event) {
        const targetNodeElement = event.target.closest('.node');
        if (!targetNodeElement) return; // Click was not on a node

        draggedNode = nodes.find(n => n.id === targetNodeElement.id);
        if (!draggedNode) return;

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

    // Initial render (if any nodes were pre-loaded, though we start empty)
    renderNodes();
});
