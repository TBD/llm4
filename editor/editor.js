document.addEventListener('DOMContentLoaded', () => {
    const nodeCanvas = document.getElementById('node-canvas');
    const addNodeBtn = document.getElementById('add-node-btn');

    let nodes = [];
    let nodeIdCounter = 0; // Simple counter for unique IDs

    let draggedNode = null;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Function to render all nodes on the canvas
    function renderNodes() {
        nodeCanvas.innerHTML = ''; // Clear canvas

        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.classList.add('node');
            nodeEl.id = node.id;
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
            nodeEl.textContent = node.name;
            // nodeEl.style.cursor = 'grab'; // Set initial cursor, will be updated on drag

            nodeCanvas.appendChild(nodeEl);
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

    // Drag and Drop Functionality
    nodeCanvas.addEventListener('mousedown', (event) => {
        const targetNodeElement = event.target.closest('.node');
        if (!targetNodeElement) return; // Click was not on a node

        draggedNode = nodes.find(n => n.id === targetNodeElement.id);
        if (!draggedNode) return;

        isDragging = true;
        targetNodeElement.style.cursor = 'grabbing';
        targetNodeElement.style.zIndex = 1000; // Bring dragged node to front

        // Calculate offset from mouse click to node's top-left corner
        const nodeRect = targetNodeElement.getBoundingClientRect();
        const canvasRect = nodeCanvas.getBoundingClientRect();

        // offsetX = event.clientX - nodeRect.left; // Offset relative to node's own coordinate system
        // offsetY = event.clientY - nodeRect.top;
        
        // Store offset relative to canvas, but based on node's current position
        // This means offsetX is the difference between mouse click X on canvas and node's X
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
        
        isDragging = false;
        draggedNode = null;
        // renderNodes(); // Ensure final state is rendered if not done in mousemove
        // Already done in mousemove, so not strictly necessary here unless optimization changes
    });

    // Initial render (if any nodes were pre-loaded, though we start empty)
    renderNodes();
});
