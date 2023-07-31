/** @format */

import { useCallback, useRef } from 'react';

// external dependencies
import ReactFlow, {
  Controls,
  applyNodeChanges,
  useReactFlow,
  addEdge,
} from 'reactflow';

// utils
import { useEdgeStore, useNodeStore } from '@/hooks/useStore';
import { DATA_TRANSFER_MIME_TYPE } from '@/constants/utils';

// components
import MessageNode, {
  messageNodeFactory,
  MESSAGE_NODE_IDENTIFIER,
} from '@/components/Nodes/MessageNode';
import SelectNode, {
  selectNodeFactory,
  SELECT_NODE_IDENTIFIER,
} from '@/components/Nodes/SelectNode';

// constants
const flowViewSettings = {
  snapGrid: [20, 20],
  defaultViewport: { x: 0, y: 0, zoom: 1.5 },
  attributionPosition: 'bottom-left',
  fitView: true,
  snapToGrid: true,
};

// node types
const nodeTypes = {
  [MESSAGE_NODE_IDENTIFIER]: MessageNode,
  [SELECT_NODE_IDENTIFIER]: SelectNode,
};

// node creators
const nodeCreator = {
  [MESSAGE_NODE_IDENTIFIER]: messageNodeFactory,
  [SELECT_NODE_IDENTIFIER]: selectNodeFactory,
};

export default function Flow() {
  // refs
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useReactFlow();

  // node store
  const nodesFromStore = useNodeStore(state => state.nodes);
  const addNode = useNodeStore(state => state.addNode);
  const setNodes = useNodeStore(state => state.setNodes);
  const setSelectedNode = useNodeStore(state => state.setSelectedNode);

  // edge store
  const edgesFromStore = useEdgeStore(state => state.edges);
  const setEdges = useEdgeStore(state => state.setEdges);

  const onNodesChange = useCallback(
    changes => {
      const updates = applyNodeChanges(changes, nodesFromStore);
      setNodes(updates);
    },
    [nodesFromStore, setNodes],
  );

  const onEdgesChange = useCallback(
    changes => {
      const updates = applyNodeChanges(changes, edgesFromStore);
      setEdges(updates);
    },
    [edgesFromStore, setEdges],
  );

  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    event => {
      event.preventDefault();

      // check if the dropped element is valid
      const nodeType = event.dataTransfer.getData(DATA_TRANSFER_MIME_TYPE);
      if (typeof nodeType === 'undefined' || !nodeType) {
        return;
      }

      // get the position of the drop
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // create a new node and add it to the store
      const newNode = nodeCreator[nodeType](position);
      addNode(newNode);
    },
    [reactFlowInstance, addNode],
  );

  /**
   * @param {array} nodes
   * @description
   * Sets the first selected node in the store.
   */
  const onSelectionChange = useCallback(
    ({ nodes }) => {
      if (nodes.length) {
        setSelectedNode(nodes[0]);
      }
    },
    [setSelectedNode],
  );

  const onConnect = useCallback(
    params => {
      setEdges(addEdge(params, edgesFromStore));
    },
    [setEdges, edgesFromStore],
  );

  const onNodesDelete = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <ReactFlow
      ref={reactFlowWrapper}
      nodeTypes={nodeTypes}
      nodes={nodesFromStore}
      edges={edgesFromStore}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      onNodesDelete={onNodesDelete}
      onSelectionChange={onSelectionChange}
      selectNodesOnDrag={false}
      {...flowViewSettings}
    >
      <Controls />
    </ReactFlow>
  );
}
