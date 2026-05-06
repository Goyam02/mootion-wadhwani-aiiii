import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState, Connection, addEdge, BackgroundVariant, MarkerType, useReactFlow, ReactFlowProvider, Handle, Position } from '@xyflow/react';
import { Send, Mic, Loader2, X, FileText, Upload, Bot, Clock, Trash2, ChevronRight, ChevronLeft, Plus, RotateCcw } from 'lucide-react';
import { Attachment } from '../types';
import { API_BASE_URL } from '../config';
import dagre from 'dagre';

// Types
interface SavedRoadmap {
  roadmap_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface RoadmapData {
  nodes: Node[];
  edges: Edge[];
}

// Dagre layout helper function
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: 'TB',
    nodesep: 120,
    ranksep: 180,
    marginx: 100,
    marginy: 100,
    edgesep: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - 125,
        y: pos.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Custom Node Component
const CustomNode = ({ id, data, selected }: { id: string, data: { label: string; description?: string; stepType?: string }, selected?: boolean }) => {
  const { updateNodeData } = useReactFlow();

  const handleLabelChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { label: evt.target.value });
  };

  const handleDescriptionChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { description: evt.target.value });
  };

  return (
    <div className={`px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-xl border-2 min-w-[220px] transition-all duration-300 bg-brand-black group ${
      selected ? 'border-brand-neon ring-1 ring-brand-neon shadow-[0_0_15px_rgba(204,255,0,0.3)]' :
      data.stepType === 'root' 
        ? 'border-brand-neon bg-brand-neon/10' 
        : data.stepType === 'milestone' 
          ? 'border-zinc-600 bg-zinc-900' 
          : 'border-zinc-800 bg-zinc-950'
    }`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-brand-neon !border-2 !border-brand-black" />
      
      <textarea
        className={`nodrag w-full bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-brand-neon/50 rounded p-1 font-display font-bold text-sm mb-1 overflow-hidden ${
             data.stepType === 'root' ? 'text-brand-neon text-lg' : 'text-white'
        }`}
        value={data.label}
        onChange={handleLabelChange}
        rows={1}
        style={{ minHeight: '28px', height: 'auto' }}
        onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
        }}
      />
      
      <textarea
        className="nodrag w-full bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded p-1 text-xs text-zinc-400 font-sans leading-tight overflow-hidden"
        value={data.description || ''}
        onChange={handleDescriptionChange}
        placeholder="Add description..."
        rows={data.description ? Math.ceil(data.description.length / 30) : 1}
        style={{ minHeight: '20px' }}
        onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
        }}
      />

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-brand-neon !border-2 !border-brand-black" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const PlanModuleContent: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [originalNodes, setOriginalNodes] = useState<Node[]>([]);
  const [originalEdges, setOriginalEdges] = useState<Edge[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ccff00', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#ccff00',
    },
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges],
  );

  // Load saved roadmaps on mount
  useEffect(() => {
    fetchSavedRoadmaps();
  }, []);

  const fetchSavedRoadmaps = async () => {
    setLoadingRoadmaps(true);
    try {
      const response = await fetch(`${API_BASE_URL}/roadmap/list`);
      if (response.ok) {
        const data = await response.json();
        setSavedRoadmaps(data);
      }
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
    }
    setLoadingRoadmaps(false);
  };

  const createNewRoadmap = () => {
    setNodes([]);
    setEdges([]);
    setOriginalNodes([]);
    setOriginalEdges([]);
    setCurrentRoadmapId(null);
    setInput('');
    setAttachments([]);
    setDocumentId(null);
    
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder*="Define strategy"]') as HTMLInputElement;
      if (inputElement) inputElement.focus();
    }, 100);
  };

  const resetToOriginal = () => {
    if (originalNodes.length > 0) {
      setNodes(originalNodes);
      setEdges(originalEdges);
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800, maxZoom: 1, minZoom: 0.5 });
      }, 100);
    }
  };

  const loadRoadmap = async (roadmapId: string) => {
    setLoading(true);
    setLoadingMessage('LOADING ROADMAP...');
    try {
      const response = await fetch(`${API_BASE_URL}/roadmap/${roadmapId}`);
      if (response.ok) {
        const data = await response.json();
        const roadmapData = data.roadmap_data;
        
        if (roadmapData.nodes && roadmapData.edges) {
          const flowNodes: Node[] = roadmapData.nodes.map((node: any) => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            data: { 
              label: node.data.label, 
              stepType: node.id === roadmapData.nodes[0]?.id ? 'root' : 'milestone' 
            }
          }));
          
          const flowEdges: Edge[] = roadmapData.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ccff00' },
            style: { stroke: '#ccff00', strokeWidth: 2 }
          }));
          
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
          
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setOriginalNodes(layoutedNodes);
          setOriginalEdges(layoutedEdges);
          setCurrentRoadmapId(roadmapId);
          
          setTimeout(() => {
            fitView({ padding: 0.2, duration: 800, maxZoom: 1, minZoom: 0.5 });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to load roadmap:', error);
    }
    setLoading(false);
    setLoadingMessage('');
  };

  const deleteRoadmap = async (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this roadmap?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/roadmap/${roadmapId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedRoadmaps(prev => prev.filter(rm => rm.roadmap_id !== roadmapId));
        if (currentRoadmapId === roadmapId) {
          createNewRoadmap();
        }
      }
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Only PDF and image files are allowed.');
        return;
      }
      
      setUploadingDoc(true);
      setLoadingMessage('UPLOADING DOCUMENT...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`${API_BASE_URL}/qa/upload-doc`, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          setDocumentId(data.document_id);
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setAttachments(prev => [...prev, {
              type: file.type.startsWith('image/') ? 'image' : 'file',
              url: result,
              base64: result.split(',')[1],
              mimeType: file.type,
              name: file.name,
              file: file
            }]);
          };
          reader.readAsDataURL(file);
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
          const errorMessage = errorData.detail || `Upload failed: ${response.status}`;
          alert(`Upload Error: ${errorMessage}`);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        alert(`Error uploading file: ${error.message}`);
      }
      
      setUploadingDoc(false);
      setLoadingMessage('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;
    setLoading(true);
    setLoadingMessage('SYNTHESIZING KNOWLEDGE GRAPH...');
    
    setNodes([]);
    setEdges([]);
    setOriginalNodes([]);
    setOriginalEdges([]);
    setCurrentRoadmapId(null);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmap/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: input,
          document_id: documentId || '',
          save: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const roadmapData = data.roadmap_data;
        
        if (roadmapData.nodes && roadmapData.edges) {
          const flowNodes: Node[] = roadmapData.nodes.map((node: any) => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            data: { 
              label: node.data.label, 
              stepType: node.id === roadmapData.nodes[0]?.id ? 'root' : 'milestone' 
            }
          }));
          
          const flowEdges: Edge[] = roadmapData.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ccff00' },
            style: { stroke: '#ccff00', strokeWidth: 2 }
          }));
          
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
          
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setOriginalNodes(layoutedNodes);
          setOriginalEdges(layoutedEdges);
          setCurrentRoadmapId(data.roadmap_id);
          
          fetchSavedRoadmaps();
          
          setTimeout(() => {
            fitView({ padding: 0.2, duration: 800, maxZoom: 1, minZoom: 0.5 });
          }, 100);
        }
      } else {
        const errorText = await response.text();
        alert(`Failed to generate roadmap: ${errorText}`);
      }
    } catch (error: any) {
      console.error('API error:', error);
      alert(`Error: ${error.message}`);
    }
    
    setLoading(false);
    setLoadingMessage('');
    setInput('');
    setAttachments([]);
    setDocumentId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full bg-brand-black overflow-hidden">
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden`}>
        {sidebarOpen && (
          <>
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-brand-neon font-bold text-lg mb-1 font-mono tracking-wider">SAVED ROADMAPS</h2>
                  <p className="text-zinc-500 text-xs">Your learning paths</p>
                </div>
                <button
                  onClick={createNewRoadmap}
                  className="p-2 rounded-lg bg-brand-neon text-black hover:bg-white transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)] hover:shadow-[0_0_15px_rgba(204,255,0,0.5)] group"
                  title="Create New Roadmap"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {loadingRoadmaps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-neon" size={24} />
                </div>
              ) : savedRoadmaps.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <FileText size={24} className="text-zinc-700" />
                  </div>
                  <p className="text-zinc-600 text-sm font-medium">No roadmaps yet</p>
                  <p className="text-zinc-700 text-xs mt-1">Click + to create your first one!</p>
                </div>
              ) : (
                savedRoadmaps.map((roadmap) => (
                  <div
                    key={roadmap.roadmap_id}
                    onClick={() => loadRoadmap(roadmap.roadmap_id)}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all group ${
                      currentRoadmapId === roadmap.roadmap_id
                        ? 'bg-brand-neon/10 border border-brand-neon shadow-[0_0_10px_rgba(204,255,0,0.2)]'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold truncate ${
                          currentRoadmapId === roadmap.roadmap_id ? 'text-brand-neon' : 'text-white'
                        }`}>
                          {roadmap.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} className="text-zinc-600" />
                          <span className="text-xs text-zinc-600">
                            {formatDate(roadmap.updated_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteRoadmap(roadmap.roadmap_id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-500 hover:text-red-400"
                        title="Delete Roadmap"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-brand-neon transition-colors text-zinc-400 hover:text-brand-neon"
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <span className="font-extrabold text-2xl tracking-tighter text-brand-neon shadow-neon-glow font-sans">
              BLOOP PLAN
            </span>
          </div>

          {/* Reset Button - Only show when nodes exist */}
          {originalNodes.length > 0 && (
            <button
              onClick={resetToOriginal}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-brand-neon transition-all text-zinc-400 hover:text-brand-neon group"
              title="Reset to Original Layout"
            >
              <RotateCcw size={16} className="group-hover:rotate-[-360deg] transition-transform duration-500" />
              <span className="text-xs font-mono font-bold mr-25 tracking-wider">RESET LAYOUT</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          
          {/* Canvas */}
          <div className="flex-1 bg-[#0a0a0a] rounded-[30px] border border-brand-neon shadow-[0_0_20px_rgba(204,255,0,0.15)] relative overflow-hidden">
            {nodes.length === 0 && !loading && !uploadingDoc && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none opacity-50">
                <div className="text-zinc-500 font-mono text-sm tracking-widest uppercase mb-2">Infinite Strategy Canvas</div>
                <div className="text-zinc-700 text-xs">Awaiting Input Protocol</div>
              </div>
            )}
            
            {(loading || uploadingDoc) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                <div className="relative mb-6">
                  <Loader2 size={64} className="text-brand-neon animate-spin" />
                  <div className="absolute inset-0 bg-brand-neon/20 rounded-full animate-ping" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="font-mono text-brand-neon text-base tracking-widest animate-pulse">{loadingMessage}</p>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
              .react-flow__controls {
                background-color: #18181b !important;
                border: 1px solid #27272a !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
              }
              .react-flow__controls-button {
                background-color: #18181b !important;
                border-bottom: 1px solid #27272a !important;
                fill: #ccff00 !important;
                color: #ccff00 !important;
              }
              .react-flow__controls-button:hover {
                background-color: #27272a !important;
              }
              .react-flow__controls-button svg {
                fill: #ccff00 !important;
              }
              .react-flow__attribution {
                display: none;
              }
            `}} />

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionLineStyle={{ stroke: '#ccff00', strokeWidth: 2 }}
              fitView
              className="bg-[#0a0a0a]"
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
              <Controls position="bottom-left" showInteractive={false} className="m-4" />
              <MiniMap 
                nodeStrokeColor={(n) => n.data.stepType === 'root' ? '#ccff00' : '#71717a'}
                nodeColor={(n) => n.data.stepType === 'root' ? '#ccff00' : '#18181b'}
                maskColor="rgba(0, 0, 0, 0.7)"
                className="!bg-zinc-900 !border !border-zinc-800 !rounded-xl !bottom-4 !right-4 !m-0 !w-48 !h-32"
              />
            </ReactFlow>
          </div>

          {/* Input Bar */}
          <div className="shrink-0 w-full flex items-center justify-between gap-4">
            <div className="w-full max-w-3xl bg-[#1a1a1a] border border-brand-neon/30 rounded-full h-12 flex items-center px-1 shadow-[0_0_15px_rgba(204,255,0,0.1)] hover:border-brand-neon/50 transition-all">
              
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingDoc}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shrink-0 group/upload ${
                  uploadingDoc ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
                title="Upload CHO"
              >
                {uploadingDoc ? (
                  <Loader2 size={18} className="animate-spin text-brand-neon" />
                ) : (
                  <Upload size={18} className="group-hover/upload:text-brand-neon" />
                )}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/*" disabled={uploadingDoc} />

              <div className="flex-1 flex items-center overflow-hidden gap-2 px-1">
                {attachments.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-zinc-800 text-brand-neon px-3 py-1 rounded-full shrink-0 border border-zinc-700 animate-fade-in">
                    <FileText size={12} className="text-brand-neon shrink-0" />
                    <span className="text-[10px] text-zinc-200 font-medium truncate">{attachments[0].name}</span>
                    <button 
                      onClick={() => { setAttachments([]); setDocumentId(null); }} 
                      className="ml-1 text-zinc-500 hover:text-white p-0.5 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                      <X size={10}/>
                    </button>
                  </div>
                )}
                
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                  placeholder={attachments.length > 0 ? "" : "Define strategy target (or upload CHO)..."}
                  className="flex-1 bg-transparent text-white focus:outline-none text-sm placeholder-zinc-500 min-w-[100px]"
                  disabled={loading || uploadingDoc}
                />
              </div>

              <div className="flex items-center gap-1 pr-1">
                <button 
                  onClick={() => setIsListening(!isListening)} 
                  disabled={loading || uploadingDoc}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    loading || uploadingDoc ? 'text-zinc-700 cursor-not-allowed' :
                    isListening ? 'text-brand-neon animate-pulse bg-brand-neon/10' : 
                    'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
                  title="Voice Input"
                >
                  <Mic size={18} />
                </button>

                <button 
                  onClick={handleGenerate}
                  disabled={loading || uploadingDoc || (!input && attachments.length === 0)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    (loading || uploadingDoc || (!input && attachments.length === 0)) 
                      ? 'bg-transparent text-zinc-700 cursor-not-allowed' 
                      : 'bg-brand-neon text-black hover:bg-white hover:shadow-[0_0_10px_rgba(204,255,0,0.5)]'
                  }`}
                  title="Generate Roadmap"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center pointer-events-none">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-neon bg-brand-neon/10 backdrop-blur-md shadow-[0_0_10px_rgba(204,255,0,0.2)]">
                <Bot size={16} className="text-brand-neon" />
                <span className="text-brand-neon text-xs font-mono font-bold tracking-widest uppercase">STRATEGY ENGINE V1.0</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const PlanModule = () => (
  <ReactFlowProvider>
    <PlanModuleContent />
  </ReactFlowProvider>
);

export default PlanModule;