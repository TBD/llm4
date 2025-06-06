(function() {
    const resultsDiv = document.getElementById('test-results');
    let testsRun = 0;
    let testsFailed = 0;
    let currentSuiteName = "";

    function log(message, cssClass) {
        const p = document.createElement('p');
        if (currentSuiteName && !message.startsWith("---")) {
            p.textContent = `[${currentSuiteName}] ${message}`;
        } else {
            p.textContent = message;
        }
        if (cssClass) {
            p.className = cssClass;
        }
        resultsDiv.appendChild(p);
    }

    function startSuite(suiteName) {
        currentSuiteName = suiteName;
        log(`--- Testing ${suiteName} ---`, "suite-title");
    }

    function assertEquals(expected, actual, message) {
        testsRun++;
        // Using JSON.stringify for a simple deep comparison for objects/arrays
        const expStr = JSON.stringify(expected);
        const actStr = JSON.stringify(actual);
        if (expStr === actStr) {
            log(`PASS: ${message}`, 'test-pass');
        } else {
            testsFailed++;
            log(`FAIL: ${message}. Expected: ${expStr}, Actual: ${actStr}`, 'test-fail');
        }
    }

    function assertDeepEquals(expected, actual, message) { // Alias for clarity
        assertEquals(expected, actual, message);
    }

    function assertTrue(condition, message) {
        testsRun++;
        if (condition) {
            log(`PASS: ${message}`, 'test-pass');
        } else {
            testsFailed++;
            log(`FAIL: ${message}. Condition not true.`, 'test-fail');
        }
    }

    function assertNotNull(value, message) {
        testsRun++;
        if (value !== null && value !== undefined) {
            log(`PASS: ${message}`, 'test-pass');
        } else {
            testsFailed++;
            log(`FAIL: ${message}. Value was null or undefined.`, 'test-fail');
        }
    }

    // --- Helper: Reset editor state (assuming globals for simplicity) ---
    function resetEditorState() {
        // These are assumed to be global variables in editor.js for testability
        nodes = [];
        connections = [];
        nodeIdCounter = 0;
        connectionIdCounter = 0;
        typeCounters = { 'Input': 0, 'LLM': 0, 'Output': 0 }; // Reset type counters
        nextNodeTypeIndex = 0; // Reset node type cycle
        if (typeof updateAddNodeButtonText === 'function') {
             updateAddNodeButtonText(); // Reset button text if function exists
        }
        if (typeof updateInspector === 'function'){
            selectedNodeId = null; // Clear selection
            updateInspector();
        }
        // Clear canvas visually if renderNodes is available
        if (typeof renderNodes === 'function') {
            renderNodes();
        }
    }

    // --- Mock DOM elements needed by editor.js functions under test if not fully DOM testing ---
    // (test_runner.html already includes some mocks)

    // --- Test Suites ---
    function runNodeDataStructureTests() {
        startSuite("Node Data Structure");
        resetEditorState();

        // Simulate clicking "Add Input Node" button
        // This requires addNodeBtn and its event listener to be set up by editor.js
        const addNodeBtn = document.getElementById('add-node-btn');
        assertNotNull(addNodeBtn, "Add Node button should exist.");

        addNodeBtn.click(); // Add Input Node
        assertEquals(1, nodes.length, "Should have 1 node after first click");
        let node1 = nodes[0];
        assertEquals('node-1', node1.id, "Node 1 ID");
        assertEquals('Input 1', node1.name, "Node 1 Name");
        assertEquals('Input', node1.type, "Node 1 Type");
        assertTrue(typeof node1.x === 'number', "Node 1 X coordinate");
        assertTrue(typeof node1.y === 'number', "Node 1 Y coordinate");
        assertNotNull(node1.content, "Node 1 Content should exist");
        assertEquals(0, node1.inputs.length, "Input node should have 0 input ports");
        assertEquals(1, node1.outputs.length, "Input node should have 1 output port");

        addNodeBtn.click(); // Add LLM Node
        assertEquals(2, nodes.length, "Should have 2 nodes after second click");
        let node2 = nodes[1];
        assertEquals('node-2', node2.id, "Node 2 ID");
        assertEquals('LLM 1', node2.name, "Node 2 Name");
        assertEquals('LLM', node2.type, "Node 2 Type");
        assertEquals(1, node2.inputs.length, "LLM node should have 1 input port");
        assertEquals(1, node2.outputs.length, "LLM node should have 1 output port");


        addNodeBtn.click(); // Add Output Node
        assertEquals(3, nodes.length, "Should have 3 nodes after third click");
        let node3 = nodes[2];
        assertEquals('node-3', node3.id, "Node 3 ID");
        assertEquals('Output 1', node3.name, "Node 3 Name");
        assertEquals('Output', node3.type, "Node 3 Type");
        assertEquals(1, node3.inputs.length, "Output node should have 1 input port");
        assertEquals(0, node3.outputs.length, "Output node should have 0 output ports");
    }

    function runConnectionsDataTests() {
        startSuite("Connections (Data)");
        resetEditorState();

        // Manually create nodes for controlled testing of connection data
        nodes.push({ id: 'n1', name: 'Input Node', type: 'Input', x: 10, y: 10, content: '', inputs: [], outputs: [{ portId: 'out1' }] });
        nodes.push({ id: 'n2', name: 'LLM Node', type: 'LLM', x: 100, y: 10, content: '', inputs: [{ portId: 'in1', connectedTo: null }], outputs: [{ portId: 'out1' }] });
        nodeIdCounter = 2; // Manually set counter after creating nodes

        // Simulate connection from n1/out1 to n2/in1
        // This requires access to 'pendingConnection' or the connection creation logic
        // For simplicity, let's assume a direct way to call the core connection logic
        // If not, this test would be harder or need to simulate mousedown events on ports

        // Simulate starting a connection
        pendingConnection = { fromNodeId: 'n1', fromPortId: 'out1', fromPortElement: document.createElement('div') };

        // Simulate completing the connection on n2's input port
        // The actual event handler in editor.js does this:
        connectionIdCounter++; // Simulating what happens in the event handler
        const newConnection = {
            id: `conn-${connectionIdCounter}`,
            fromNodeId: pendingConnection.fromNodeId,
            fromPortId: pendingConnection.fromPortId,
            toNodeId: 'n2',
            toPortId: 'in1'
        };
        connections.push(newConnection);
        const targetNode = nodes.find(n => n.id === 'n2');
        const targetInputPort = targetNode.inputs.find(p => p.portId === 'in1');
        targetInputPort.connectedTo = { nodeId: pendingConnection.fromNodeId, portId: pendingConnection.fromPortId };
        pendingConnection = null; // Reset pending connection

        assertEquals(1, connections.length, "Should have 1 connection in connections array");
        const conn = connections[0];
        assertEquals('conn-1', conn.id, "Connection ID");
        assertEquals('n1', conn.fromNodeId, "Connection fromNodeId");
        assertEquals('out1', conn.fromPortId, "Connection fromPortId");
        assertEquals('n2', conn.toNodeId, "Connection toNodeId");
        assertEquals('in1', conn.toPortId, "Connection toPortId");

        const n2InputPort = nodes.find(n => n.id === 'n2').inputs[0];
        assertNotNull(n2InputPort.connectedTo, "Node n2 input port should be connected");
        assertEquals('n1', n2InputPort.connectedTo.nodeId, "Node n2 input connectedTo correct nodeId");
        assertEquals('out1', n2InputPort.connectedTo.portId, "Node n2 input connectedTo correct portId");
    }

    function runSerializationTests() {
        startSuite("Serialization");
        resetEditorState();

        nodes.push({ id: 's_n1', name: 'Input A', type: 'Input', x: 10, y: 10, content: 'Data A', inputs: [], outputs: [{ portId: 's_p_n1_out1' }] });
        nodes.push({ id: 's_n2', name: 'LLM B', type: 'LLM', x: 200, y: 10, content: 'LLM Prompt', inputs: [{portId: 's_p_n2_in1', connectedTo: {nodeId: 's_n1', portId: 's_p_n1_out1'}}], outputs: [{portId: 's_p_n2_out1'}] });
        nodeIdCounter = 2;
        typeCounters['Input'] = 1; typeCounters['LLM'] = 1;

        connections.push({ id: 's_c1', fromNodeId: 's_n1', fromPortId: 's_p_n1_out1', toNodeId: 's_n2', toPortId: 's_p_n2_in1' });
        connectionIdCounter = 1;

        assertTrue(typeof serializeGraph === 'function', "serializeGraph function should exist");
        const jsonGraph = serializeGraph();

        assertTrue(jsonGraph.includes('"id":"s_n1"'), "Serialized graph should contain node s_n1");
        assertTrue(jsonGraph.includes('"type":"Input"'), "Node s_n1 type should be Input");
        assertTrue(jsonGraph.includes('"content":"Data A"'), "Node s_n1 content should be Data A");
        assertTrue(jsonGraph.includes('"id":"s_c1"'), "Serialized graph should contain connection s_c1");
        assertTrue(jsonGraph.includes('"fromNodeId":"s_n1"'), "Connection s_c1 should be from s_n1");
        assertTrue(jsonGraph.includes('"connectedTo":{"nodeId":"s_n1","portId":"s_p_n1_out1"}'), "s_n2 input connection details should be serialized");

        // Test Deserialization
        assertTrue(typeof deserializeGraph === 'function', "deserializeGraph function should exist");
        deserializeGraph(jsonGraph);
        assertEquals(2, nodes.length, "Deserialized graph should have 2 nodes");
        assertEquals(1, connections.length, "Deserialized graph should have 1 connection");

        const deserialized_n1 = nodes.find(n => n.id === 's_n1');
        const deserialized_n2 = nodes.find(n => n.id === 's_n2');

        assertEquals('Input A', deserialized_n1.name, "Node s_n1 name after deserialization");
        assertEquals('LLM B', deserialized_n2.name, "Node s_n2 name after deserialization");
        assertEquals('Data A', deserialized_n1.content, "Node s_n1 content after deserialization");
        assertNotNull(deserialized_n2.inputs[0].connectedTo, "Node s_n2 input should be connected after deserialization");
        assertEquals('s_n1', deserialized_n2.inputs[0].connectedTo.nodeId, "Node s_n2 input connectedTo correct nodeId after deserialization");

        // Check counters
        assertTrue(nodeIdCounter >= 2, "nodeIdCounter should be updated after deserialization");
        assertTrue(connectionIdCounter >= 1, "connectionIdCounter should be updated after deserialization");
        assertTrue(typeCounters['Input'] >= 1, "typeCounter for Input should be updated");
        assertTrue(typeCounters['LLM'] >= 1, "typeCounter for LLM should be updated");
    }

    function runGraphExecutionDataTests() {
        startSuite("Graph Execution (Data)");
        resetEditorState();

        // Setup a simple graph: Input1 -> LLM1 -> Output1
        nodes.push({ id: 'exec_n1', name: 'Input 1', type: 'Input', x: 10, y: 10, content: 'Initial data', inputs: [], outputs: [{ portId: 'out1' }] });
        nodes.push({ id: 'exec_n2', name: 'LLM 1', type: 'LLM', x: 150, y: 10, content: 'LLM context', inputs: [{ portId: 'in1', connectedTo: {nodeId: 'exec_n1', portId: 'out1'} }], outputs: [{ portId: 'out1' }] });
        nodes.push({ id: 'exec_n3', name: 'Output 1', type: 'Output', x: 300, y: 10, content: '', inputs: [{ portId: 'in1', connectedTo: {nodeId: 'exec_n2', portId: 'out1'} }], outputs: [] });
        connections.push({ id: 'exec_c1', fromNodeId: 'exec_n1', fromPortId: 'out1', toNodeId: 'exec_n2', toPortId: 'in1' });
        connections.push({ id: 'exec_c2', fromNodeId: 'exec_n2', fromPortId: 'out1', toNodeId: 'exec_n3', toPortId: 'in1' });

        // Mock console.log to capture output for runGraph
        let capturedLogs = [];
        const originalConsoleLog = console.log;
        console.log = (message) => { capturedLogs.push(message); };

        assertTrue(typeof runGraph === 'function', "runGraph function should exist");
        runGraph();

        console.log = originalConsoleLog; // Restore console.log

        // Check captured logs for key steps
        assertTrue(capturedLogs.some(log => log.includes("Input Node 'Input 1' producing: Initial data")), "Input node should produce data");
        assertTrue(capturedLogs.some(log => log.includes("Processing Node 'LLM 1' (LLM) with input: Initial data")), "LLM node should process input data");
        assertTrue(capturedLogs.some(log => log.includes("LLM Node 'LLM 1' transformed data to: LLM processed: Initial data")), "LLM node should transform data");
        assertTrue(capturedLogs.some(log => log.includes("Processing Node 'Output 1' (Output) with input: LLM processed: Initial data")), "Output node should receive processed data");
        assertTrue(capturedLogs.some(log => log.includes("Output Node 'Output 1' received: LLM processed: Initial data")), "Output node log final reception");
        assertTrue(capturedLogs.some(log => log.includes("Graph execution finished.")), "Graph execution should finish");
    }


    // --- Run all tests ---
    // Clear results area
    resultsDiv.innerHTML = '';

    runNodeDataStructureTests();
    runConnectionsDataTests();
    runSerializationTests();
    runGraphExecutionDataTests();
    // Add more test suites for connections, execution logic etc.

    log(`--- Summary: ${testsRun - testsFailed} / ${testsRun} tests passed. ---`, testsFailed > 0 ? 'test-fail' : 'test-pass');
    if (testsFailed > 0) {
        log("THERE WERE TEST FAILURES. CHECK THE LOGS ABOVE.", 'test-fail');
    } else {
        log("ALL TESTS PASSED!", 'test-pass');
    }

})();
