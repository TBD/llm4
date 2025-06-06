const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load HTML file to simulate the DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Global document, window, etc.
let dom;
let window;
let document; // Re-assign document for each test to have a fresh DOM
let editorModule; // To store the loaded editor.js module

// Mock global functions used in editor.js
global.alert = jest.fn();
global.prompt = jest.fn();

describe('Node Editor Core Functionalities', () => {
    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
        window = dom.window;
        document = window.document;

        // Make document and window global for the script to access
        global.window = window;
        global.document = document;
        global.SVGElement = window.SVGElement; // JSDOM doesn't always provide this globally

        // Load editor.js script into the JSDOM environment
        // This requires editor.js to be written in a way that it can be re-evaluated,
        // or we need a way to access its functions/state.
        // For simplicity, we'll re-require it or attach its main object to window if possible.
        // If editor.js attaches its main functions to window, that's easier.
        // Otherwise, we might need to refactor editor.js to export its functions.

        // Assuming editor.js is structured to run on load and attach to DOMContentLoaded
        // We need to simulate DOMContentLoaded or call an init function if editor.js has one.

        // For now, let's try to execute the script directly.
        // Note: This is a simplified way. For complex modules, you'd use module loaders.
        const scriptContent = fs.readFileSync(path.resolve(__dirname, '../editor.js'), 'utf8');
        const scriptEl = document.createElement('script');
        scriptEl.textContent = scriptContent;
        document.body.appendChild(scriptEl);

        // editorModule would ideally be the exported parts of editor.js
        // If editor.js doesn't export, we test by interacting with the DOM and checking global state.
    });

    afterEach(() => {
        // Clean up JSDOM
        window.close();
        // Clear mocks
        global.alert.mockClear();
        global.prompt.mockClear();
    });

    describe('Node Creation', () => {
        test('should add a new Input node to the nodes array', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            expect(addNodeBtn).not.toBeNull();

            // Initial state: "Add Input Node"
            expect(addNodeBtn.textContent).toBe('Add Input Node');
            addNodeBtn.click(); // Add Input Node

            // Access internal state (nodes array) - this is tricky if not exposed
            // For this test, we'll assume 'nodes' is a global or accessible for inspection.
            // If editor.js uses an IIFE, state might be private.
            // Let's assume for now we can get it via a debug global or by checking DOM elements.

            const nodesOnCanvas = document.querySelectorAll('.node');
            expect(nodesOnCanvas.length).toBe(1);
            const nodeEl = nodesOnCanvas[0];
            expect(nodeEl.id).toBe('node-1'); // First node ID
            expect(nodeEl.classList.contains('node-type-input')).toBe(true);
            expect(nodeEl.textContent).toContain('Input 1');

            // Check button text update
            expect(addNodeBtn.textContent).toBe('Add LLM Node');
        });

        test('should increment nodeIdCounter and typeCounters correctly', () => {
            const addNodeBtn = document.getElementById('add-node-btn');

            addNodeBtn.click(); // Input 1 (node-1)
            const node1 = document.getElementById('node-1');
            expect(node1).not.toBeNull();
            expect(node1.textContent).toContain('Input 1');

            addNodeBtn.click(); // LLM 1 (node-2)
            const node2 = document.getElementById('node-2');
            expect(node2).not.toBeNull();
            expect(node2.textContent).toContain('LLM 1');
            expect(node2.classList.contains('node-type-llm')).toBe(true);

            addNodeBtn.click(); // Output 1 (node-3)
            const node3 = document.getElementById('node-3');
            expect(node3).not.toBeNull();
            expect(node3.textContent).toContain('Output 1');
            expect(node3.classList.contains('node-type-output')).toBe(true);

            addNodeBtn.click(); // Input 2 (node-4)
            const node4 = document.getElementById('node-4');
            expect(node4).not.toBeNull();
            expect(node4.textContent).toContain('Input 2');
            expect(node4.classList.contains('node-type-input')).toBe(true);
        });

        test('newly created nodes should have default properties', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Input 1

            const nodeEl = document.getElementById('node-1');
            expect(nodeEl).not.toBeNull();

            // To check internal properties, we'd need access to the 'nodes' array from editor.js
            // This is a limitation if the state isn't exposed.
            // For now, we test what's observable via DOM or assumed structure.
            expect(nodeEl.style.left).toMatch(/\d+px/); // x position
            expect(nodeEl.style.top).toMatch(/\d+px/);  // y position

            // Check for ports (Input node has no input port, one output port)
            const outputPorts = nodeEl.querySelectorAll('.output-port');
            expect(outputPorts.length).toBe(1);
            const inputPorts = nodeEl.querySelectorAll('.input-port');
            expect(inputPorts.length).toBe(0);

            // TODO: How to access selectedNode and its content property without global state?
            // For now, assume clicking selects it and inspector populates.
            nodeEl.click(); // Simulate selection
            const inspectorContentInput = document.getElementById('node-content-input');
            expect(inspectorContentInput).not.toBeNull();
            expect(inspectorContentInput.value).toBe('Content for Input 1');
        });
    });

    describe('Node Properties', () => {
        test('should update node name via inspector', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Add Input 1 (node-1), it's selected by default

            const nodeEl = document.getElementById('node-1');
            expect(nodeEl).not.toBeNull();

            const nameInput = document.getElementById('node-name-input');
            expect(nameInput).not.toBeNull();

            nameInput.value = 'Updated Test Node';
            nameInput.dispatchEvent(new window.Event('input', { bubbles: true })); // Simulate input event

            expect(nodeEl.textContent).toContain('Updated Test Node');
            // Add a check for the internal 'nodes' array if it becomes accessible
        });

        test('should update node content via inspector', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Add Input 1, selected

            const contentTextarea = document.getElementById('node-content-input');
            expect(contentTextarea).not.toBeNull();

            contentTextarea.value = 'New detailed content.';
            contentTextarea.dispatchEvent(new window.Event('input', { bubbles: true }));

            // To verify, ideally check the 'nodes' array.
            // For now, re-selecting the node (if selection clears) or checking value if it persists.
            // Let's assume the value in textarea reflects the current state.
            expect(contentTextarea.value).toBe('New detailed content.');
        });

        test('selected node should have "selected" class', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Node 1 (Input)
            addNodeBtn.click(); // Node 2 (LLM) - this one should be selected

            const node1El = document.getElementById('node-1');
            const node2El = document.getElementById('node-2');

            expect(node1El.classList.contains('selected')).toBe(false);
            expect(node2El.classList.contains('selected')).toBe(true);

            // Click node1 to change selection
            node1El.dispatchEvent(new window.Event('mousedown', { bubbles: true }));

            expect(node1El.classList.contains('selected')).toBe(true);
            expect(node2El.classList.contains('selected')).toBe(false);
        });
    });

    describe('Connections', () => {
        let node1, node2, node3;
        let portOutNode1, portInNode2, portOutNode2, portInNode3;

        beforeEach(() => {
            const addNodeBtn = document.getElementById('add-node-btn');
            // Create Input node (node-1), has 1 output port
            addNodeBtn.click();
            node1 = document.getElementById('node-1');
            portOutNode1 = node1.querySelector('.output-port');
            expect(portOutNode1).toBeTruthy();

            // Create LLM node (node-2), has 1 input, 1 output
            addNodeBtn.click();
            node2 = document.getElementById('node-2');
            portInNode2 = node2.querySelector('.input-port');
            portOutNode2 = node2.querySelector('.output-port');
            expect(portInNode2).toBeTruthy();
            expect(portOutNode2).toBeTruthy();

            // Create Output node (node-3), has 1 input port
            addNodeBtn.click();
            node3 = document.getElementById('node-3');
            portInNode3 = node3.querySelector('.input-port');
            expect(portInNode3).toBeTruthy();
        });

        test('should create a connection between two nodes', () => {
            // Click output port of Node 1
            portOutNode1.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            expect(portOutNode1.classList.contains('connecting')).toBe(true);

            // Click input port of Node 2
            portInNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            expect(portOutNode1.classList.contains('connecting')).toBe(false); // Class removed after connection

            const svgLines = document.querySelectorAll('#connections-svg line');
            expect(svgLines.length).toBe(1);
            // More detailed line coordinate checks are possible but complex due to dynamic positions
        });

        test('should prevent self-connection (output to input of same node)', () => {
            // LLM node (node-2) has one input and one output.
            // Try to connect output of node-2 to input of node-2
            portOutNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true })); // Start connection from node-2 output
            expect(portOutNode2.classList.contains('connecting')).toBe(true);

            // Attempt to connect to node-2 input
            portInNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true })); // Click input of same node

            // Connection should not be made
            const svgLines = document.querySelectorAll('#connections-svg line');
            expect(svgLines.length).toBe(0);
            expect(portOutNode2.classList.contains('connecting')).toBe(true); // Still connecting, as target was invalid

            // Clean up pending connection by clicking canvas
            document.getElementById('node-canvas').dispatchEvent(new window.Event('mousedown', {bubbles: true}));
            expect(portOutNode2.classList.contains('connecting')).toBe(false);
        });


        test('should prevent connecting output port to another output port', () => {
            // Click output port of Node 1
            portOutNode1.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            expect(portOutNode1.classList.contains('connecting')).toBe(true);

            // Attempt to click output port of Node 2
            const anotherOutputPort = node2.querySelector('.output-port');
            anotherOutputPort.dispatchEvent(new window.Event('mousedown', { bubbles: true }));

            // The connection should not be made with portOutNode1
            // Instead, pendingConnection should now start from anotherOutputPort
            expect(portOutNode1.classList.contains('connecting')).toBe(false); // Old one reset
            expect(anotherOutputPort.classList.contains('connecting')).toBe(true); // New one starts

            const svgLines = document.querySelectorAll('#connections-svg line');
            expect(svgLines.length).toBe(0);
        });
    });

    describe('Serialization/Deserialization', () => {
        beforeEach(() => {
            // Ensure a clean state for each serialization/deserialization test
            // This is partly handled by the main beforeEach, but good to be aware
        });

        test('serializeGraph should produce correct JSON for a simple graph', () => {
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Input 1 (node-1)
            addNodeBtn.click(); // LLM 1 (node-2)

            const node1 = document.getElementById('node-1');
            const node2 = document.getElementById('node-2');
            const portOutNode1 = node1.querySelector('.output-port');
            const portInNode2 = node2.querySelector('.input-port');

            // Create a connection
            portOutNode1.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            portInNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true }));

            const saveBtn = document.getElementById('save-graph-btn');
            global.prompt.mockReturnValueOnce(null); // Dismiss any prompts if save triggers them (it shouldn't for this test)

            // Mock URL.createObjectURL and a.click for download part
            global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-blob-url');
            global.URL.revokeObjectURL = jest.fn();
            const mockLink = { click: jest.fn(), download: '', href: '' };
            jest.spyOn(document, 'createElement').mockImplementationOnce(() => mockLink);


            // To get the JSON, we need to intercept it.
            // The current saveGraphBtn logs to console and triggers download.
            // Let's modify the test to check console.log or make serializeGraph globally available.
            // For now, let's assume serializeGraph can be called or spy on console.log.
            let serializedJson = "";
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(output => {
                if (output.includes('"nodes":') && output.includes('"connections":')) {
                     serializedJson = output;
                }
            });

            saveBtn.click();
            expect(mockLink.click).toHaveBeenCalled(); // download was triggered

            expect(serializedJson).not.toBe("");
            const graphData = JSON.parse(serializedJson);

            expect(graphData.nodes.length).toBe(2);
            expect(graphData.connections.length).toBe(1);
            expect(graphData.nodes[0].id).toBe('node-1');
            expect(graphData.nodes[0].type).toBe('Input');
            expect(graphData.nodes[1].id).toBe('node-2');
            expect(graphData.nodes[1].type).toBe('LLM');
            expect(graphData.connections[0].fromNodeId).toBe('node-1');
            expect(graphData.connections[0].toNodeId).toBe('node-2');
            expect(graphData.nodes[1].inputs[0].connectedTo.nodeId).toBe('node-1');

            consoleSpy.mockRestore();
            jest.spyOn(document, 'createElement').mockRestore();
        });

        test('deserializeGraph should correctly load a graph', () => {
            const sampleGraph = {
                nodes: [
                    { id: 'node-10', name: 'Loaded Input', type: 'Input', x: 10, y: 10, content: 'Loaded content', outputs: [{portId: 'port-out'}], inputs:[] },
                    { id: 'node-11', name: 'Loaded LLM', type: 'LLM', x: 200, y: 10, content: 'LLM content', inputs: [{portId: 'port-in', connectedTo: null}], outputs: [{portId: 'port-out'}] }
                ],
                connections: []
            };
            const jsonString = JSON.stringify(sampleGraph);

            global.prompt.mockReturnValueOnce(jsonString); // Simulate user pasting JSON
            const loadBtn = document.getElementById('load-graph-btn');
            loadBtn.click();

            expect(alert).toHaveBeenCalledWith("Graph loaded successfully!");
            const nodesOnCanvas = document.querySelectorAll('.node');
            expect(nodesOnCanvas.length).toBe(2);
            const node10 = document.getElementById('node-10');
            const node11 = document.getElementById('node-11');
            expect(node10).not.toBeNull();
            expect(node11).not.toBeNull();
            expect(node10.textContent).toContain('Loaded Input');
            expect(node11.textContent).toContain('Loaded LLM');
            expect(node10.classList.contains('node-type-input')).toBe(true);

            // Check if counters updated (next node should be node-12)
            const addNodeBtn = document.getElementById('add-node-btn');
            addNodeBtn.click(); // Should be an Output node now (assuming types cycle and Input was last used in this test setup before load)
                               // Or it might be Input if load resets type cycle. Let's check what type it is.
            const newNode = document.getElementById('node-12'); // Next nodeId based on loaded max
            expect(newNode).not.toBeNull();

        });
    });

    describe('Graph Execution', () => {
        let consoleSpy;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'log');
            const addNodeBtn = document.getElementById('add-node-btn');

            // Create Input node (Input 1, node-1)
            addNodeBtn.click();
            const node1 = document.getElementById('node-1');
            node1.querySelector('#node-content-input') // This ID is on inspector, need to select node first
            node1.dispatchEvent(new window.Event('mousedown', { bubbles: true })); // select it
            let contentTextarea = document.getElementById('node-content-input');
            contentTextarea.value = 'Test input data';
            contentTextarea.dispatchEvent(new window.Event('input', { bubbles: true }));


            // Create LLM node (LLM 1, node-2)
            addNodeBtn.click();
            const node2 = document.getElementById('node-2');
            node2.dispatchEvent(new window.Event('mousedown', { bubbles: true })); // select it
            contentTextarea = document.getElementById('node-content-input');
            contentTextarea.value = 'LLM node own content'; // Not used if input is connected
            contentTextarea.dispatchEvent(new window.Event('input', { bubbles: true }));

            // Create Output node (Output 1, node-3)
            addNodeBtn.click();

            // Connect Input -> LLM
            const portOutNode1 = document.getElementById('node-1').querySelector('.output-port');
            const portInNode2 = document.getElementById('node-2').querySelector('.input-port');
            portOutNode1.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            portInNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true }));

            // Connect LLM -> Output
            const portOutNode2 = document.getElementById('node-2').querySelector('.output-port');
            const portInNode3 = document.getElementById('node-3').querySelector('.input-port');
            portOutNode2.dispatchEvent(new window.Event('mousedown', { bubbles: true }));
            portInNode3.dispatchEvent(new window.Event('mousedown', { bubbles: true }));

            // Clear selection to avoid inspector issues for next step
            document.getElementById('node-canvas').dispatchEvent(new window.Event('mousedown', {bubbles: true}));
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        test('should execute a simple linear graph (Input -> LLM -> Output)', () => {
            const runBtn = document.getElementById('run-graph-btn');
            runBtn.click();

            expect(console.log).toHaveBeenCalledWith("Starting graph execution...");
            expect(console.log).toHaveBeenCalledWith("Input Node 'Input 1' producing: Test input data");
            expect(console.log).toHaveBeenCalledWith("Processing Node 'LLM 1' (LLM) with input: Test input data");
            expect(console.log).toHaveBeenCalledWith("LLM Node 'LLM 1' transformed data to: LLM processed: Test input data");
            expect(console.log).toHaveBeenCalledWith("Processing Node 'Output 1' (Output) with input: LLM processed: Test input data");
            expect(console.log).toHaveBeenCalledWith("Output Node 'Output 1' received: LLM processed: Test input data");
            expect(console.log).toHaveBeenCalledWith("Graph execution finished.");
        });
    });
});
