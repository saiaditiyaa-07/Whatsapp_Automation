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
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Play,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Copy,
  ChevronLeft,
  X,
  Settings,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Register Node Types for presentation labels
const TRIGGER_TYPES = [
  { type: "incoming_message", label: "Incoming Message", desc: "Triggers on any inbound customer message" },
  { type: "keyword_match", label: "Keyword Match", desc: "Triggers if message contains key strings" },
  { type: "first_customer_message", label: "First Message", desc: "Triggers on first message from customer" },
  { type: "business_hours", label: "Business Hours", desc: "Triggers during/out of office hours" },
  { type: "conversation_created", label: "Conversation Created", desc: "Triggers when chat session is created" }
];

const CONDITION_TYPES = [
  { type: "message_contains", label: "Contains Text", desc: "Check if body contains substring" },
  { type: "exact_keyword", label: "Equals Text", desc: "Check if body matches exact keyword" },
  { type: "customer_tag", label: "Customer Tag", desc: "Check if customer has a tag" },
  { type: "conversation_status", label: "Conversation Status", desc: "Check if open or archived" },
  { type: "time_range", label: "Time Range Check", desc: "Check current execution hour range" }
];

const ACTION_TYPES = [
  { type: "send_message", label: "Send WhatsApp Message", desc: "Dispatches a template or custom text reply" },
  { type: "delay", label: "Delay / Pause", desc: "Wait for a duration before next action" },
  { type: "add_tag", label: "Add Customer Tag", desc: "Appends tag to the customer conversation" },
  { type: "remove_tag", label: "Remove Customer Tag", desc: "Removes tag from the conversation" },
  { type: "assign_conversation", label: "Assign Owner", desc: "Assign conversation to a team agent" },
  { type: "call_webhook", label: "Call Webhook", desc: "POST event payload to external REST API" },
  { type: "ai_response", label: "AI Response", desc: "Generates smart AI reply simulation" }
];

interface VisualWorkflowBuilderProps {
  workflowId: string;
  workspaceId: string;
  onBack: () => void;
}

export default function VisualWorkflowBuilder({
  workflowId,
  workspaceId,
  onBack
}: VisualWorkflowBuilderProps) {
  // Canvas Graph States
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Workflow Metadata
  const [workflowName, setWorkflowName] = useState("Loading Workflow...");
  const [workflowDesc, setWorkflowDesc] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  
  // Selected Node State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Dynamic typed configuration config getter for selected node to prevent typescript compile crashes
  const selectedNodeConfig = (selectedNode?.data as any)?.config || {};

  // Status Bar States
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "error">("synced");
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [previewOutput, setPreviewOutput] = useState<any | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Undo/Redo stack hooks
  const [historyStack, setHistoryStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUpdatingHistory = useRef(false);

  // Fetch initial workflow canvas and configuration details
  const fetchWorkflow = useCallback(async () => {
    try {
      // 1. Fetch Workflow details
      const detailsRes = await fetch(
        `${API_BASE}/api/v1/workflows/${workflowId}?workspace_id=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (!detailsRes.ok) throw new Error("Failed to load details");
      const details = await detailsRes.json();
      setWorkflowName(details.name);
      setWorkflowDesc(details.description || "");
      setIsActive(details.is_active);

      // 2. Fetch Canvas layout JSON
      const canvasRes = await fetch(
        `${API_BASE}/api/v1/workflows/${workflowId}/canvas?workspace_id=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (canvasRes.ok) {
        const canvas = await canvasRes.json();
        setNodes(canvas.nodes || []);
        setEdges(canvas.edges || []);
        // Save initial history
        setHistoryStack([{ nodes: canvas.nodes || [], edges: canvas.edges || [] }]);
        setHistoryIndex(0);
      }

      // 3. Set Mock version history entries
      setVersionHistory([
        { version: 1, savedAt: details.updated_at, createdBy: "Admin", changes: "Initial layout draft" }
      ]);
    } catch (err) {
      console.error("Failed to load workflow builder canvas:", err);
    }
  }, [workflowId, workspaceId, setNodes, setEdges]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Record history step for Undo/Redo operations
  const recordHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (isUpdatingHistory.current) return;
    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Save Canvas back to backend REST API
  const saveCanvas = async (currentNodes: Node[], currentEdges: Edge[]) => {
    setSaveStatus("saving");
    try {
      const payload = {
        nodes: currentNodes,
        edges: currentEdges
      };
      
      const res = await fetch(
        `${API_BASE}/api/v1/workflows/${workflowId}/canvas?workspace_id=${workspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        const errs = errorData.detail?.errors || [];
        setValidationErrors(errs);
        setSaveStatus("error");
        return;
      }
      
      setValidationErrors([]);
      setSaveStatus("synced");
      // Add version entry
      setVersionHistory((prev) => [
        { version: prev.length + 1, savedAt: new Date().toISOString(), createdBy: "Admin", changes: "Auto saved draft modifications" },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  // Debounced auto save implementation (saves 2s after changes stop)
  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(() => {
      saveCanvas(nodes, edges);
    }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Connect Nodes Handler
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(
        {
          ...params,
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" }
        },
        edges
      );
      setEdges(newEdges);
      recordHistory(nodes, newEdges);
    },
    [edges, nodes, setEdges, recordHistory]
  );

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    isUpdatingHistory.current = true;
    const prevStep = historyStack[historyIndex - 1];
    setNodes(prevStep.nodes);
    setEdges(prevStep.edges);
    setHistoryIndex(historyIndex - 1);
    setTimeout(() => {
      isUpdatingHistory.current = false;
    }, 50);
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex >= historyStack.length - 1) return;
    isUpdatingHistory.current = true;
    const nextStep = historyStack[historyIndex + 1];
    setNodes(nextStep.nodes);
    setEdges(nextStep.edges);
    setHistoryIndex(historyIndex + 1);
    setTimeout(() => {
      isUpdatingHistory.current = false;
    }, 50);
  };

  // Add Custom Node from Toolbox Click/Drag
  const addNewNode = (type: string, label: string) => {
    const defaultConfigs: Record<string, any> = {
      incoming_message: {},
      keyword_match: { keywords: ["pricing", "demo"], case_sensitive: false },
      first_customer_message: {},
      business_hours: { start_hour: 9, end_hour: 17, match_out_of_hours: false },
      conversation_created: {},
      message_contains: { text: "support" },
      exact_keyword: { keyword: "billing" },
      customer_tag: { tag: "VIP" },
      conversation_status: { status: "open" },
      time_range: { start: "09:00", end: "17:00" },
      send_message: { text: "Hello! Thank you for reaching out." },
      delay: { duration_seconds: 60 },
      add_tag: { tag: "lead" },
      remove_tag: { tag: "lead" },
      assign_conversation: { user_id: "" },
      call_webhook: { url: "https://api.mycrm.com/whatsapp-hook" },
      ai_response: { prompt: "Answer pricing questions politely" }
    };

    const newNode: Node = {
      id: `${type}_${uuid()}`,
      type: type,
      position: { x: 150 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: {
        label: label,
        config: defaultConfigs[type] || {}
      },
      style: {
        background: "#1e1b4b",
        color: "#ffffff",
        border: "1px solid #4338ca",
        borderRadius: "8px",
        padding: "10px",
        width: 180
      }
    };
    
    const updated = [...nodes, newNode];
    setNodes(updated);
    recordHistory(updated, edges);
  };

  // Unique UUID helper
  const uuid = () => Math.random().toString(36).substring(2, 9);

  // Toggle Workflow active status
  const toggleWorkflowStatus = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/workflows/${workflowId}/toggle?workspace_id=${workspaceId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (res.ok) {
        setIsActive(!isActive);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Node Inspector Update Config Properties
  const updateNodeConfig = (key: string, value: any) => {
    if (!selectedNode) return;
    const updatedNodes = nodes.map((n) => {
      if (n.id === selectedNode.id) {
        const newConf = { ...(n.data as any).config, [key]: value };
        const newNode = { ...n, data: { ...n.data, config: newConf } };
        setSelectedNode(newNode);
        return newNode;
      }
      return n;
    });
    setNodes(updatedNodes);
  };

  // Delete Selected Node / Edge
  const deleteSelected = () => {
    if (!selectedNode) return;
    const updatedNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const updatedEdges = edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNode(null);
    recordHistory(updatedNodes, updatedEdges);
  };

  // Run Graph Execution Preview Simulation
  const runExecutionPreview = async () => {
    setIsPreviewing(true);
    setPreviewOutput(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/workflows/${workflowId}/preview?workspace_id=${workspaceId}&message_text=Pricing%20check`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (res.ok) {
        const trace = await res.json();
        setPreviewOutput(trace);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full text-slate-100 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      
      {/* Top Header Bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-100">{workflowName}</h1>
            <p className="text-xs text-slate-400">Visual Workflow Orchestrator</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Status Save Badge */}
          {saveStatus === "synced" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-2.5 py-1 bg-emerald-950/30 rounded-full border border-emerald-900/50">
              <CheckCircle size={12} /> Auto-Saved
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-indigo-400 px-2.5 py-1 bg-indigo-950/30 rounded-full border border-indigo-900/50 animate-pulse">
              <RefreshCw size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-rose-400 px-2.5 py-1 bg-rose-950/30 rounded-full border border-rose-900/50">
              <AlertTriangle size={12} /> Errors Blocked Sync
            </span>
          )}

          {/* Enable Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Status</span>
            <button
              onClick={toggleWorkflowStatus}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isActive ? "bg-purple-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <button
            onClick={runExecutionPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 transition"
          >
            <Play size={14} /> Preview Run
          </button>
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Toolbox Panels (Triggers, Conditions, Actions) */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/40 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
          <div>
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">1. Triggers</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {TRIGGER_TYPES.map((trig) => (
                <button
                  key={trig.type}
                  onClick={() => addNewNode(trig.type, trig.label)}
                  className="flex flex-col text-left p-3 bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/10 rounded-xl transition group"
                >
                  <span className="text-sm font-medium group-hover:text-purple-400 flex items-center gap-1.5">
                    <Plus size={14} /> {trig.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{trig.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-3">2. Conditions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {CONDITION_TYPES.map((cond) => (
                <button
                  key={cond.type}
                  onClick={() => addNewNode(cond.type, cond.label)}
                  className="flex flex-col text-left p-3 bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-950/10 rounded-xl transition group"
                >
                  <span className="text-sm font-medium group-hover:text-sky-400 flex items-center gap-1.5">
                    <Plus size={14} /> {cond.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{cond.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">3. Actions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {ACTION_TYPES.map((act) => (
                <button
                  key={act.type}
                  onClick={() => addNewNode(act.type, act.label)}
                  className="flex flex-col text-left p-3 bg-slate-900 border border-slate-800 hover:border-emerald-505 hover:bg-emerald-950/10 rounded-xl transition group"
                >
                  <span className="text-sm font-medium group-hover:text-emerald-400 flex items-center gap-1.5">
                    <Plus size={14} /> {act.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{act.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central Canvas View (React Flow Viewport) */}
        <div className="flex-1 h-full relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(e, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="bg-slate-900 border border-slate-800 text-white rounded-lg" />
            <MiniMap 
              position="bottom-left"
              style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "10px" }}
              nodeColor="#4f46e5"
            />
            
            {/* Canvas Panel Control buttons */}
            <Panel position="top-right" className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 p-2 rounded-xl">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="px-2.5 py-1.5 text-xs bg-slate-850 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed rounded"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1}
                className="px-2.5 py-1.5 text-xs bg-slate-850 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed rounded"
              >
                Redo
              </button>
            </Panel>

            {/* Validation Banner inside Canvas */}
            {validationErrors.length > 0 && (
              <Panel position="top-left" className="bg-rose-950/80 border border-rose-900/50 backdrop-blur p-3.5 rounded-xl max-w-sm flex flex-col gap-2 shadow-lg">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <AlertTriangle size={14} /> Structural Validation Errors ({validationErrors.length})
                </span>
                <ul className="list-disc pl-4 text-slate-300 text-xs flex flex-col gap-1.5">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>
                      <span className="font-semibold text-rose-300">[{err.node_id}]</span> {err.message}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar: dynamic node configuration panel or history */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/40 p-5 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          
          {selectedNode ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Settings size={16} className="text-purple-400" /> Node Settings
                </h3>
                <button
                  onClick={deleteSelected}
                  className="p-1.5 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-900/30 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Node Type</label>
                  <div className="text-sm text-slate-200 capitalize font-medium">{selectedNode.type?.replace("_", " ")}</div>
                </div>

                {/* keyword match trigger inputs */}
                {selectedNode.type === "keyword_match" && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Keywords</label>
                      <input
                        type="text"
                        placeholder="Comma separated: pricing, cost"
                        value={selectedNodeConfig.keywords?.join(", ") || ""}
                        onChange={(e) =>
                          updateNodeConfig(
                            "keywords",
                            e.target.value.split(",").map((k) => k.trim())
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* business hours trigger */}
                {selectedNode.type === "business_hours" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Start Hour</label>
                        <input
                          type="number"
                          value={selectedNodeConfig.start_hour || 9}
                          onChange={(e) => updateNodeConfig("start_hour", parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">End Hour</label>
                        <input
                          type="number"
                          value={selectedNodeConfig.end_hour || 17}
                          onChange={(e) => updateNodeConfig("end_hour", parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* send message action inputs */}
                {selectedNode.type === "send_message" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Message Text</label>
                    <textarea
                      rows={4}
                      value={selectedNodeConfig.text || ""}
                      onChange={(e) => updateNodeConfig("text", e.target.value)}
                      placeholder="Hi {{customer_name}}, thank you for reaching out!"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      Variables: {"{{customer_name}}"}, {"{{customer_phone}}"}
                    </div>
                  </div>
                )}

                {/* delay action duration inputs */}
                {selectedNode.type === "delay" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={selectedNodeConfig.duration_seconds || 60}
                      onChange={(e) => updateNodeConfig("duration_seconds", parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                {/* tag action fields */}
                {(selectedNode.type === "add_tag" || selectedNode.type === "remove_tag") && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tag Name</label>
                    <input
                      type="text"
                      value={selectedNodeConfig.tag || ""}
                      onChange={(e) => updateNodeConfig("tag", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                {/* call webhook fields */}
                {selectedNode.type === "call_webhook" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
                    <input
                      type="text"
                      placeholder="https://api.domain.com/endpoint"
                      value={selectedNodeConfig.url || ""}
                      onChange={(e) => updateNodeConfig("url", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                {/* AI prompt placeholder config */}
                {selectedNode.type === "ai_response" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">AI Context / Prompt</label>
                    <textarea
                      rows={3}
                      value={selectedNodeConfig.prompt || ""}
                      onChange={(e) => updateNodeConfig("prompt", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Default configuration side view shows workflow description and version change history
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock size={16} /> Version History
                </h3>
                <p className="text-xs text-slate-400 mb-3">Audits of canvas changes and executions counts.</p>
                <div className="flex flex-col gap-2">
                  {versionHistory.map((v, i) => (
                    <div key={i} className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-400">Version {v.version}</span>
                        <span className="text-[10px] text-slate-500">{new Date(v.savedAt).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-[11px] text-slate-300 font-medium">{v.changes}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Trace Logs Details */}
              {previewOutput && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Play size={12} /> Execution Preview Trace
                  </h4>
                  <div className="flex flex-col gap-3 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Trigger Matched:</span>
                      <span className={`font-semibold ${previewOutput.trace?.trigger_match ? "text-emerald-400" : "text-rose-400"}`}>
                        {previewOutput.trace?.trigger_match ? "YES" : "NO"}
                      </span>
                    </div>
                    
                    {previewOutput.trace?.actions_simulated?.length > 0 && (
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Simulated Actions Steps:</span>
                        <div className="flex flex-col gap-1.5">
                          {previewOutput.trace.actions_simulated.map((sim: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded-lg border border-slate-850">
                              <span className="font-semibold text-slate-400">{sim.sequence + 1}.</span>
                              <span className="text-slate-200 capitalize font-medium">{sim.action_type.replace("_", " ")}</span>
                              <ArrowRight size={10} className="text-slate-500 ml-auto" />
                              <span className="text-emerald-400 font-semibold text-[10px]">SUCCESS</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
