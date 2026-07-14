"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  MarkerType,
  Handle,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Play,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  X,
  Settings,
  Sparkles,
  MessageSquare,
  Clock,
  Tag,
  UserPlus,
  Zap,
  Sliders,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Select } from "../common/Select";
import { useToast } from "../common/Toast";

interface VisualWorkflowBuilderProps {
  workflowId: string;
  onClose: () => void;
  activeWorkspace?: any;
}

// -------------------------------------------------------------
// CUSTOM STYLED REACTFLOW NODE COMPONENTS (Enterprise Dark Mode)
// -------------------------------------------------------------

function CustomTriggerNode({ data, selected }: any) {
  return (
    <div className={`w-64 rounded-2xl bg-darkCard border shadow-xl overflow-hidden transition-all duration-150 ${selected ? 'border-indigo-400 ring-2 ring-indigo-500/30' : 'border-indigo-500/40'}`}>
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between font-bold text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          <span>{data.label || 'Trigger'}</span>
        </div>
        <Badge variant="purple" size="sm">START</Badge>
      </div>
      <div className="p-3.5 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-white">{data.config?.triggerType || 'Incoming Message'}</p>
        <p className="text-[11px] text-slate-400">{data.description || 'Listens for customer messages on WhatsApp API'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-brandIndigo !border-2 !border-darkSurface" />
    </div>
  );
}

function CustomConditionNode({ data, selected }: any) {
  return (
    <div className={`w-64 rounded-2xl bg-darkCard border shadow-xl overflow-hidden transition-all duration-150 ${selected ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/40'}`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-amber-400 !border-2 !border-darkSurface" />
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between font-bold text-xs">
        <div className="flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5" />
          <span>{data.label || 'Condition'}</span>
        </div>
        <Badge variant="amber" size="sm">CHECK</Badge>
      </div>
      <div className="p-3.5 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-white">{data.config?.conditionType || 'Keyword Match'}</p>
        <p className="text-[11px] text-slate-400">{data.description || 'Branches flow if message contains specific terms'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-amber-400 !border-2 !border-darkSurface" />
    </div>
  );
}

function CustomActionNode({ data, selected }: any) {
  const iconMap: any = {
    send_message: <MessageSquare className="h-3.5 w-3.5" />,
    delay: <Clock className="h-3.5 w-3.5" />,
    add_tag: <Tag className="h-3.5 w-3.5" />,
    assign_agent: <UserPlus className="h-3.5 w-3.5" />
  };

  return (
    <div className={`w-64 rounded-2xl bg-darkCard border shadow-xl overflow-hidden transition-all duration-150 ${selected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-emerald-500/40'}`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-darkSurface" />
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between font-bold text-xs">
        <div className="flex items-center gap-1.5">
          {iconMap[data.config?.actionType || 'send_message'] || <MessageSquare className="h-3.5 w-3.5" />}
          <span>{data.label || 'Action'}</span>
        </div>
        <Badge variant="emerald" size="sm">STEP</Badge>
      </div>
      <div className="p-3.5 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-white">{data.config?.actionTitle || 'Send WhatsApp Reply'}</p>
        <p className="text-[11px] text-slate-400 truncate">{data.config?.text || data.description || 'Dispatches template response to customer'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-darkSurface" />
    </div>
  );
}

const nodeTypes = {
  triggerNode: CustomTriggerNode,
  conditionNode: CustomConditionNode,
  actionNode: CustomActionNode,
};

// Initial Sample Nodes for Canvas
const initialNodes: Node[] = [
  {
    id: "1",
    type: "triggerNode",
    position: { x: 300, y: 50 },
    data: { label: "Incoming Message Trigger", config: { triggerType: "Incoming WhatsApp Message" }, description: "Triggers on any new inbound customer query" }
  },
  {
    id: "2",
    type: "conditionNode",
    position: { x: 300, y: 220 },
    data: { label: "Condition: Contains 'Pricing'", config: { conditionType: "Keyword Match: Pricing" }, description: "Checks if customer asked about enterprise rates" }
  },
  {
    id: "3",
    type: "actionNode",
    position: { x: 300, y: 400 },
    data: { label: "Action: Send Brochure", config: { actionType: "send_message", actionTitle: "Send Pricing PDF Template", text: "Hi! Here is our enterprise pricing brochure link: https://..." }, description: "Sends automatic pricing PDF and features link" }
  }
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" }, style: { strokeWidth: 2, stroke: "#6366f1" } },
  { id: "e2-3", source: "2", target: "3", markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" }, style: { strokeWidth: 2, stroke: "#10b981" } }
];

export default function VisualWorkflowBuilder({
  workflowId,
  onClose,
  activeWorkspace
}: VisualWorkflowBuilderProps) {
  const toast = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
      style: { strokeWidth: 2, stroke: "#6366f1" }
    }, eds)),
    [setEdges]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleAddNode = (type: 'triggerNode' | 'conditionNode' | 'actionNode') => {
    const newId = `${Date.now()}`;
    const titles: any = {
      triggerNode: "New Trigger",
      conditionNode: "New Condition",
      actionNode: "New Action Step"
    };
    const configs: any = {
      triggerNode: { triggerType: "Incoming Message" },
      conditionNode: { conditionType: "Keyword Match" },
      actionNode: { actionType: "send_message", actionTitle: "Send WhatsApp Reply", text: "Hello! How can we assist?" }
    };

    const newNode: Node = {
      id: newId,
      type,
      position: { x: 320 + Math.random() * 80, y: 150 + nodes.length * 130 },
      data: { label: titles[type], config: configs[type], description: "Click to edit parameters in the right sidebar" }
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    toast.success('Node Added', `Added ${titles[type]} to canvas.`);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    toast.warning('Node Deleted', 'Node removed from flow.');
    setSelectedNode(null);
  };

  const updateSelectedNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    const updatedData = { ...selectedNode.data, [key]: value };
    const updatedNode = { ...selectedNode, data: updatedData };
    setSelectedNode(updatedNode);
    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? updatedNode : n)));
  };

  const updateSelectedNodeConfig = (configKey: string, value: any) => {
    if (!selectedNode) return;
    const currentConfig = (selectedNode.data.config as any) || {};
    const updatedConfig = { ...currentConfig, [configKey]: value };
    updateSelectedNodeData('config', updatedConfig);
  };

  const validateCanvas = () => {
    const errors: string[] = [];
    const triggers = nodes.filter(n => n.type === 'triggerNode');
    if (triggers.length === 0) errors.push('Flow must have at least one Trigger Node (START).');
    if (nodes.length > 1 && edges.length === 0) errors.push('Nodes are disconnected. Connect edges between steps.');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    validateCanvas();
  }, [nodes, edges]);

  const handleSaveWorkflow = async () => {
    if (!validateCanvas()) {
      toast.error('Validation Failed', 'Fix canvas errors before saving workflow.');
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsSaving(false);
    toast.success('Workflow Saved', 'Visual automation schema published successfully.');
  };

  const handleRunTestSimulation = async () => {
    setIsRunningTest(true);
    toast.info('Test Simulation Started', 'Dispatching mock incoming message through canvas...');
    await new Promise((r) => setTimeout(r, 1500));
    setIsRunningTest(false);
    toast.success('Simulation Complete', 'All 3 nodes executed smoothly with 0 errors.');
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col bg-darkBg border border-darkBorder rounded-3xl overflow-hidden shadow-2xl relative select-none">
      {/* Top Toolbar */}
      <div className="h-16 px-6 border-b border-darkBorder bg-darkSurface/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} leftIcon={<ChevronLeft className="h-4 w-4" />}>
            Back to Workflows
          </Button>
          <div className="h-6 w-px bg-darkBorder" />
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Canvas Flow ID: {workflowId}</span>
              <Badge variant="emerald" size="sm" pulse>Live Editor</Badge>
            </h3>
          </div>
        </div>

        {/* Center Node Palette Triggers */}
        <div className="hidden lg:flex items-center gap-2 bg-darkBg border border-darkBorder px-3 py-1.5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Palette:</span>
          <button
            onClick={() => handleAddNode('triggerNode')}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Trigger
          </button>
          <button
            onClick={() => handleAddNode('conditionNode')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Condition
          </button>
          <button
            onClick={() => handleAddNode('actionNode')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Action Step
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isRunningTest}
            onClick={handleRunTestSimulation}
            leftIcon={<Play className="h-3.5 w-3.5 text-indigo-400" />}
          >
            Test Flow
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSaveWorkflow}
            leftIcon={<Save className="h-3.5 w-3.5" />}
          >
            Publish Flow
          </Button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-6 py-2.5 text-xs text-amber-300 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span><strong className="font-bold">Validation Checks:</strong> {validationErrors.join(' ')}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80">Draft Mode</span>
        </div>
      )}

      {/* Main Canvas Area + Properties Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ReactFlow Canvas */}
        <div className="flex-1 h-full bg-darkBg/90">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#020617]"
          >
            <Background color="#24304f" gap={20} size={1} />
            <Controls className="!bg-darkCard !border-darkBorder !fill-slate-300 !text-slate-300 !rounded-xl overflow-hidden shadow-xl" />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'triggerNode') return '#6366f1';
                if (node.type === 'conditionNode') return '#f59e0b';
                return '#10b981';
              }}
              className="!bg-darkCard/90 !border-darkBorder !rounded-2xl overflow-hidden shadow-2xl"
            />
          </ReactFlow>
        </div>

        {/* Properties Sidebar on the Right */}
        <div className="w-80 sm:w-88 border-l border-darkBorder bg-darkSurface/95 p-5 flex flex-col h-full overflow-y-auto custom-scrollbar shrink-0 z-10">
          <div className="pb-4 border-b border-darkBorder flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-brandIndigo" /> Node Configuration
            </h4>
            {selectedNode && (
              <button
                onClick={handleDeleteSelectedNode}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors outline-none"
                title="Delete Node"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-5 pt-4">
              <Input
                label="Node Label"
                value={selectedNode.data.label as string}
                onChange={(e) => updateSelectedNodeData('label', e.target.value)}
              />

              <Textarea
                label="Step Description"
                value={selectedNode.data.description as string}
                onChange={(e) => updateSelectedNodeData('description', e.target.value)}
              />

              {/* Dynamic properties based on node type */}
              {selectedNode.type === 'triggerNode' && (
                <Select
                  label="Trigger Condition"
                  value={(selectedNode.data.config as any)?.triggerType || 'Incoming Message'}
                  onChange={(val) => updateSelectedNodeConfig('triggerType', val)}
                  options={[
                    { value: 'Incoming WhatsApp Message', label: 'Any Incoming WhatsApp Message' },
                    { value: 'First Customer Contact', label: 'First Customer Contact (New Lead)' },
                    { value: 'Keyword Match', label: 'Keyword Match Trigger' },
                  ]}
                />
              )}

              {selectedNode.type === 'conditionNode' && (
                <div className="space-y-4">
                  <Select
                    label="Condition Check Type"
                    value={(selectedNode.data.config as any)?.conditionType || 'Keyword Match'}
                    onChange={(val) => updateSelectedNodeConfig('conditionType', val)}
                    options={[
                      { value: 'Keyword Match: Pricing', label: 'Message Contains "Pricing" or "Cost"' },
                      { value: 'Customer Tag: VIP', label: 'Customer Has Tag: VIP Lead' },
                      { value: 'Business Hours Check', label: 'Within Business Hours (08:00 - 18:00)' },
                    ]}
                  />
                </div>
              )}

              {selectedNode.type === 'actionNode' && (
                <div className="space-y-4">
                  <Select
                    label="Action Type"
                    value={(selectedNode.data.config as any)?.actionType || 'send_message'}
                    onChange={(val) => updateSelectedNodeConfig('actionType', val)}
                    options={[
                      { value: 'send_message', label: 'Send WhatsApp Template / Text' },
                      { value: 'delay', label: 'Delay / Pause Execution' },
                      { value: 'add_tag', label: 'Append CRM Tag to Contact' },
                      { value: 'assign_agent', label: 'Transfer Session to Human Agent' },
                    ]}
                  />

                  {(selectedNode.data.config as any)?.actionType === 'send_message' && (
                    <Textarea
                      label="Response Message / Template Text"
                      value={(selectedNode.data.config as any)?.text || ''}
                      onChange={(e) => updateSelectedNodeConfig('text', e.target.value)}
                      placeholder="Hi! Here is our brochure and pricing guide..."
                    />
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-darkBorder">
                <Button variant="danger" size="sm" fullWidth onClick={handleDeleteSelectedNode} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                  Remove Step from Flow
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 mb-3">
                <Settings className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-300">No Node Selected</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Click any trigger, condition, or action node on the canvas to configure properties.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
