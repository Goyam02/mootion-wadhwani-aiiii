import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sparkles, RefreshCw, 
  Map, BarChart3, Users, HelpCircle, AlertCircle, CheckCircle2, Clock, Calendar, X,
  ListChecks, Plus
} from 'lucide-react';
import { ReactFlow, Background, Controls, Handle, Position, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../../api';
import { ChapterInfo, ClassInfo, ClassAnalytics, DoubtEntry, AssignmentInfo } from '../../types';

// Activity types accepted by the backend ALLOWED_ASSIGNMENT_TYPES
const ACTIVITY_OPTIONS = [
  { id: 'explain_ai',  label: 'Explain It (Teach the AI)' },
  { id: 'predict_ai',  label: 'Predict It (POE)' },
  { id: 'quiz',        label: 'Quiz (MCQ)' },
  { id: 'spot_it',     label: 'Spot the Mistake' },
  { id: 'connect_it',  label: 'Connect It (Concept Map)' },
  { id: 'video',       label: 'Concept Video' },
];

// --- Status helpers (module-level so custom nodes can use them) ---
const STATUS_COLORS: Record<string, string> = {
  unset: '#64748b',
  generated: '#f59e0b',
  active: '#10b981',
  data_ready: '#06b6d4',
};
const getStatusColor = (s: string) => STATUS_COLORS[s] ?? '#64748b';
const STATUS_LABELS: Record<string, string> = {
  unset: 'Unassigned',
  generated: 'Assigned',
  active: 'Active',
  data_ready: 'Live',
};
const getStatusLabel = (s: string) => STATUS_LABELS[s] ?? 'Unassigned';

// --- Custom React Flow node: root subject node ---
const RootNode = ({ data }: { data: any }) => (
  <div style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid #8b5cf6', borderRadius: 12, color: '#fff', width: 200, padding: '10px 14px', boxShadow: '0 0 18px rgba(139,92,246,0.25)', textAlign: 'center' }}>
    <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6', border: 'none' }} />
    <div style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Primary Topic</div>
    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>{data.subject} Overview</div>
  </div>
);

// --- Custom React Flow node: chapter/unit node ---
const ChapterNode = ({ data }: { data: any }) => {
  const color = getStatusColor(data.status ?? 'unset');
  const label = getStatusLabel(data.status ?? 'unset');
  const isUnset = !data.status || data.status === 'unset';
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: `2px solid ${color}`,
        borderRadius: 12,
        color: '#fff',
        width: 190,
        padding: '10px 12px 10px',
        boxShadow: isUnset ? 'none' : `0 0 14px ${color}30`,
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {data.index != null ? `Ch. ${data.index + 1}` : 'Chapter'}
        </span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 4, lineHeight: 1.3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {data.title}
      </div>

      {/* Status label */}
      <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e293b', marginBottom: 8 }} />

      {/* Assign button — plain React onClick, always works */}
      <button
        onClick={(e) => { e.stopPropagation(); data.onAssign?.(); }}
        style={{
          width: '100%',
          padding: '5px 0',
          borderRadius: 7,
          border: isUnset ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(16,185,129,0.3)',
          background: isUnset ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.08)',
          color: isUnset ? '#a78bfa' : '#34d399',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 12 }}>{isUnset ? '+' : '✓'}</span>
        {isUnset ? 'Assign Activities' : 'Re-assign'}
      </button>
    </div>
  );
};

// --- Custom React Flow node: sub-concept node ---
const ConceptNode = ({ data }: { data: any }) => (
  <div style={{ background: 'rgba(15,23,42,0.5)', border: `1px dashed ${data.color ?? '#334155'}`, borderRadius: 8, color: '#fff', width: 160, padding: '7px 10px' }}>
    <Handle type="target" position={Position.Top} style={{ background: data.color ?? '#334155', border: 'none', width: 6, height: 6 }} />
    <div style={{ fontSize: 7, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Concept</div>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{data.title}</div>
  </div>
);

export const ClassView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  // Navigation layout: 'roadmap' (default) or 'dashboard'
  const [viewMode, setViewMode] = useState<'roadmap' | 'dashboard'>('roadmap');
  
  // Data States
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [doubts, setDoubts] = useState<DoubtEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Assignment states
  const [selectedChapter, setSelectedChapter] = useState<ChapterInfo | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['explain_ai', 'predict_ai', 'quiz']);
  const [deadline, setDeadline] = useState(() =>
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [instructionsNote, setInstructionsNote] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (!classId) return;

    async function loadData() {
      try {
        const classes = await api.getTeacherClasses();
        const found = classes.find(c => c.class_id === classId);
        if (found) {
          setClassInfo(found);
          localStorage.setItem('active_class_id', classId!);
        }

        const chs = await api.getChapters(classId!);
        const sorted = chs.sort((a, b) => a.sequence_number - b.sequence_number);
        setChapters(sorted);

        // Fetch curriculum details if available
        try {
          const curricula = await api.getCurricula(classId!);
          if (curricula && curricula.length > 0) {
            const activeCurr = curricula.find(c => c.status === 'active') || curricula[0];
            const currDetails = await api.getCurriculumDetails(classId!, activeCurr.curriculum_id);
            setCurriculum(currDetails);
          }
        } catch (currErr) {
          console.warn('Failed to load curriculum details', currErr);
        }

        // Pre-fetch Analytics, Doubts & Assignments for Dashboard
        const [analyticsData, doubtList, assignList] = await Promise.allSettled([
          api.getClassAnalytics(classId!),
          api.getDoubts(),
          api.getAssignments(classId!),
        ]);

        if (analyticsData.status === 'fulfilled') setClassAnalytics(analyticsData.value);
        if (doubtList.status === 'fulfilled') setDoubts(doubtList.value.filter(d => d.status === 'pending').slice(0, 3));
        if (assignList.status === 'fulfilled') setAssignments(assignList.value as any);
      } catch (e) {
        console.error('Failed to load class view data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [classId]);

  const handleBootstrapCurriculum = async () => {
    if (!classId) return;
    setBootstrapping(true);
    try {
      const currRes = await api.bootstrapCurriculum(classId);
      if (currRes && currRes.curriculum_id) {
        await api.bootstrapChapters(classId, currRes.curriculum_id);
        
        // Fetch the detailed curriculum we just bootstrapped
        try {
          const currDetails = await api.getCurriculumDetails(classId, currRes.curriculum_id);
          setCurriculum(currDetails);
        } catch (currErr) {
          console.warn('Failed to load curriculum details after bootstrap', currErr);
        }

        const chs = await api.getChapters(classId);
        const sorted = chs.sort((a, b) => a.sequence_number - b.sequence_number);
        setChapters(sorted);
      } else {
        alert('Failed to get curriculum ID from backend.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to bootstrap curriculum: backend missing or database issue.');
    } finally {
      setBootstrapping(false);
    }
  };

  // Stable nodeTypes — must be defined with useMemo to prevent React Flow re-mounting nodes
  const nodeTypes = useMemo(() => ({
    rootNode: RootNode,
    chapterNode: ChapterNode,
    conceptNode: ConceptNode,
  }), []);

  // Build React Flow nodes and edges using custom node types
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];

  if (classInfo) {
    if (curriculum && curriculum.curriculum_data && curriculum.curriculum_data.root) {
      // ---- Curriculum tree layout ----
      const rootNode = curriculum.curriculum_data.root;
      const units: any[] = rootNode.children || [];
      const columnSpacing = 280;
      const totalWidth = (units.length - 1) * columnSpacing;
      const rootX = totalWidth / 2 + 100;

      flowNodes.push({
        id: 'root-class',
        type: 'rootNode',
        data: { subject: classInfo.subject },
        position: { x: rootX, y: 20 },
      });

      units.forEach((unitNode: any, unitIdx: number) => {
        const unitX = unitIdx * columnSpacing + 110;
        const ch = chapters.find(c => c.source_node_id === unitNode.id);
        const nodeId = ch ? ch.chapter_id : unitNode.id;

        flowNodes.push({
          id: nodeId,
          type: 'chapterNode',
          data: {
            title: ch ? ch.title : unitNode.title,
            status: ch?.status ?? 'unset',
            index: unitIdx,
            onAssign: ch ? () => { setSelectedChapter(ch); setAssignOpen(true); } : undefined,
          },
          position: { x: unitX, y: 180 },
        });

        flowEdges.push({
          id: `root-${nodeId}`,
          source: 'root-class',
          target: nodeId,
          animated: ch ? ch.status !== 'unset' : false,
          style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
        });

        const topics: any[] = unitNode.children || [];
        topics.forEach((topicNode: any, topicIdx: number) => {
          flowNodes.push({
            id: topicNode.id,
            type: 'conceptNode',
            data: { title: topicNode.title, color: ch ? getStatusColor(ch.status) : '#334155' },
            position: { x: unitX + 15, y: 340 + topicIdx * 110 },
          });
          const srcId = topicIdx === 0 ? nodeId : topics[topicIdx - 1].id;
          flowEdges.push({
            id: `e-${srcId}-${topicNode.id}`,
            source: srcId,
            target: topicNode.id,
            animated: ch?.status === 'active',
            style: { stroke: ch ? getStatusColor(ch.status) : '#334155', strokeWidth: 1.2, strokeDasharray: (!ch || ch.status === 'unset') ? '3' : 'none' },
          });
        });
      });
    } else {
      // ---- Flat grid layout (no curriculum tree yet) ----
      const cols = Math.min(3, chapters.length);
      const totalW = (cols - 1) * 270;
      flowNodes.push({
        id: 'root-class',
        type: 'rootNode',
        data: { subject: classInfo.subject },
        position: { x: totalW / 2 + 50, y: 20 },
      });

      chapters.forEach((ch, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        flowNodes.push({
          id: ch.chapter_id,
          type: 'chapterNode',
          data: {
            title: ch.title,
            status: ch.status,
            index: idx,
            onAssign: () => { setSelectedChapter(ch); setAssignOpen(true); },
          },
          position: { x: col * 270 + 50, y: row * 200 + 180 },
        });
        if (row === 0) {
          flowEdges.push({ id: `root-${ch.chapter_id}`, source: 'root-class', target: ch.chapter_id, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 1.5 } });
        } else {
          const parent = chapters[idx - cols];
          if (parent) flowEdges.push({ id: `e-${parent.chapter_id}-${ch.chapter_id}`, source: parent.chapter_id, target: ch.chapter_id, animated: ch.status !== 'unset', style: { stroke: getStatusColor(ch.status), strokeWidth: 1.5, strokeDasharray: ch.status === 'unset' ? '4' : 'none' } });
        }
      });
    }
  }


  const handleAssignSubmit = async () => {
    if (!classId || !selectedChapter || selectedActivities.length === 0) return;
    setSubmittingAssignment(true);

    try {
      // Create one assignment per selected activity type
      for (const actType of selectedActivities) {
        const actLabel = ACTIVITY_OPTIONS.find(a => a.id === actType)?.label || actType;
        await api.createAssignment(classId, {
          chapter_id: selectedChapter.chapter_id,
          assignment_type: actType,
          title: `${selectedChapter.title} — ${actLabel}`,
          instructions: instructionsNote || undefined
        });
      }

      // Refresh chapter list so roadmap nodes update status
      const refreshedChapters = await api.getChapters(classId);
      setChapters(refreshedChapters.sort((a, b) => a.sequence_number - b.sequence_number));

      // Refresh assignments list for dashboard
      const refreshedAssignments = await api.getAssignments(classId);
      setAssignments(refreshedAssignments as any);

      setAssignOpen(false);
      setSelectedChapter(null);
      setInstructionsNote('');
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 4000);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to assign topic. Please try again.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const toggleActivity = (type: string) => {
    setSelectedActivities(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#07070c] relative z-10">
        <span className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Loading Roadmap Data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#07070c] relative z-10 p-6 md:p-8 min-h-screen text-slate-100">
      <div className="grid-overlay" />
      <div className="ambient-light" />

      {/* Header and Back navigation */}
      <div className="flex flex-col gap-4 mb-6 shrink-0">
        <button
          onClick={() => navigate('/teacher/home')}
          className="text-slate-400 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Classes</span>
        </button>

        {classInfo && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-600/10 px-3 py-1 rounded-full border border-violet-500/20">
                Class Code: {classInfo.class_code}
              </span>
              <h1 className="text-3xl font-extrabold text-slate-200 mt-2 font-heading">
                Class {classInfo.grade} — {classInfo.subject}
              </h1>
            </div>
            
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
              <button
                onClick={() => setViewMode('roadmap')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  viewMode === 'roadmap' 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map size={14} /> Roadmap Graph
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  viewMode === 'dashboard' 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 size={14} /> Dashboard View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chapters content area */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {viewMode === 'roadmap' ? (
          chapters.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-slate-900 rounded-2xl bg-slate-950/40 backdrop-blur-sm min-h-[500px] text-center p-8 gap-4">
              <div className="w-14 h-14 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 animate-bounce">
                <Map size={24} />
              </div>
              <h3 className="font-extrabold text-slate-200 text-lg font-heading">No Curriculum Chapters Bootstrapped</h3>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-semibold">
                No chapters generated yet. The NCERT syllabus curriculum is not bootstrapped in the database.
              </p>
              <button
                onClick={handleBootstrapCurriculum}
                disabled={bootstrapping}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
              >
                {bootstrapping ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>{bootstrapping ? "Bootstrapping Syllabus..." : "Bootstrap NCERT Syllabus"}</span>
              </button>
            </div>
          ) : (
            /* REACT FLOW ROADMAP GRAPH with custom interactive nodes */
            <div className="w-full border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/40 backdrop-blur-sm h-[650px] relative">
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                fitView
              >
                <Background color="#1e293b" gap={16} />
                <Controls />
              </ReactFlow>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 z-10 text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span>Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                  <span>Unassigned</span>
                </div>
              </div>
            </div>
          )
        ) : (
          /* CLASS ANALYTICS DASHBOARD VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">
            
            {/* Left Columns (Class Completion + Student List) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Class Completion Card */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Class Completion</h3>
                  <span className="text-4xl font-extrabold font-heading text-violet-400">
                    {classAnalytics?.task_completion_rate !== undefined ? `${classAnalytics.task_completion_rate}%` : 'No Data Available'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Progress across all assigned modules and chapter tasks.</p>
                <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-500"
                    style={{ width: `${classAnalytics?.task_completion_rate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mt-1">
                  <span>0% Started</span>
                  <span>{classAnalytics?.task_completion_rate || 0}% Completed</span>
                  <span>100% Mastered</span>
                </div>
              </div>

              {/* Assigned Tasks List Card */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ListChecks size={16} className="text-violet-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Assigned Tasks</h3>
                  </div>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                    {assignments.length} Tasks
                  </span>
                </div>

                {assignments.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {assignments.map((a: any) => (
                      <div key={a.assignment_id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[220px]">{a.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                            {(a.assignment_type || '').replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          a.status === 'ready'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : a.status === 'failed'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-950/20 border border-slate-800 rounded-xl text-center text-xs text-slate-500 font-semibold">
                    No tasks assigned yet. Click a chapter node on the Roadmap to assign activities.
                  </div>
                )}
              </div>

              {/* Student Progress List Card */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-violet-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Student Progress List</h3>
                  </div>
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/25">
                    Backend Missing
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-400 leading-relaxed font-semibold">
                    Note: Roster database endpoint is currently missing in the backend API. Showing active students from the Class Analytics Overview logs:
                  </div>

                  {classAnalytics?.recent_activities && classAnalytics.recent_activities.length > 0 ? (
                    classAnalytics.recent_activities.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/30 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-200">{act.student_name}</span>
                          <span className="text-[10px] text-slate-450 font-medium">Topic: {act.chapter_title} ({act.activity_type.replace('_', ' ').toUpperCase()})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`status-pill text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            act.score >= 2 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}>
                            Score: {act.score}/3
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Clock size={11} /> {act.date}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-slate-950/20 border border-slate-800 rounded-xl text-center text-xs text-slate-500 italic font-semibold">
                      No Student Activity Data Available (No submissions logged yet).
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Doubts + Support alerts) */}
            <div className="flex flex-col gap-6">
              {/* Most Common Doubts Card */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <HelpCircle size={16} className="text-violet-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Most Common Doubts</h3>
                </div>

                <div className="flex flex-col gap-3">
                  {doubts.length > 0 ? (
                    doubts.map(d => (
                      <div key={d.doubt_id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-800 flex flex-col gap-1.5 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wide">{d.student_name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{d.text}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-slate-950/20 border border-slate-800 rounded-xl text-center text-xs text-slate-550 italic font-semibold">
                      No doubts logged yet (No active student doubts).
                    </div>
                  )}
                </div>
              </div>

              {/* Needs Support Widget */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-450" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Needs Support</h3>
                  </div>
                  <span className="text-[9px] font-bold text-rose-450 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/25">
                    Backend Missing
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="p-8 bg-slate-950/20 border border-slate-800 rounded-xl text-center text-xs text-slate-550 italic font-semibold">
                    Needs Support analytics endpoint is not implemented in the backend API.
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* SUCCESS TOAST */}
      {assignSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-bold">Assigned to all enrolled students successfully!</span>
        </div>
      )}

      {/* ASSIGN TOPIC MODAL */}
      {assignOpen && selectedChapter && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setAssignOpen(false)} />
          
          <div className="glass-panel p-8 max-w-lg w-full relative z-10 animate-scale-up border border-slate-800 bg-[#0c0c14] shadow-2xl flex flex-col gap-6">
            <button 
              onClick={() => setAssignOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-heading">
                Assign to Class
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Assign activities for <span className="font-bold text-violet-400">{selectedChapter.title}</span> to all enrolled students.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Class Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Class / Section</label>
                <input 
                  type="text" 
                  value={classInfo ? `Class ${classInfo.grade} — ${classInfo.subject}` : ''} 
                  disabled 
                  className="form-input bg-slate-950 border-slate-800 text-slate-400"
                />
              </div>

              {/* Activities Checkboxes */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Activities to Include</label>
                
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map(act => {
                    const active = selectedActivities.includes(act.id);
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => toggleActivity(act.id)}
                        className={`text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all ${
                          active 
                            ? 'bg-violet-600 text-white border-violet-500/40 shadow-sm' 
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>

                {selectedActivities.length === 0 && (
                  <p className="text-[10px] text-rose-400 font-bold">Select at least one activity to assign.</p>
                )}
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
                  <Calendar size={12} /> Due Date <span className="text-slate-600 normal-case font-medium">(informational only)</span>
                </label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="form-input bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>

              {/* Instructions text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Teacher Instructions (optional)</label>
                <textarea 
                  placeholder="Add special notes or context for students..."
                  value={instructionsNote}
                  onChange={(e) => setInstructionsNote(e.target.value)}
                  rows={2}
                  className="form-input bg-slate-950 border-slate-800 text-slate-200 resize-none text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleAssignSubmit}
              disabled={submittingAssignment || selectedActivities.length === 0}
              className="btn-primary w-full py-3 mt-2 font-bold"
            >
              {submittingAssignment ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Assigning to all students...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Assign to All Students</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
