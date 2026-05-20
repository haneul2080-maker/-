import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Brain,
  Download,
  Upload,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Copy,
  Sparkles,
  CheckSquare,
  HelpCircle,
  RefreshCw,
  FolderOpen,
  Workflow,
  PlusCircle,
  Clock,
  Settings,
  X,
  PlusSquare,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Image,
  AlertCircle,
  Check,
  Award,
  CircleDot,
  Lightbulb,
  FileText,
  Target,
  LayoutGrid
} from 'lucide-react';

// Define the Node interface
interface MindNode {
  id: string;
  x: number;
  y: number;
  label: string;
  notes?: string;
  type: 'idea' | 'task' | 'question' | 'goal' | 'info';
  color: string; // Tailwind bg theme representation
  parentId?: string;
  completed?: boolean;
  imageUrl?: string; // Concept artwork
  tasks?: Array<{ id: string; text: string; done: boolean }>;
}

// Define the Map interface
interface MindMap {
  id: string;
  name: string;
  updatedAt: string;
  nodes: MindNode[];
}

// Predefined beautifully polished templates
const TEMPLATES: Record<string, { name: string; description: string; nodes: MindNode[] }> = {
  software_arch: {
    name: "🚀 SaaS Software Architecture",
    description: "An elegant baseline architectural flow diagram for deploying a modern cloud web app.",
    nodes: [
      { id: "root", x: 100, y: 300, label: "Core Web App SaaS", type: "goal", color: "sky", notes: "The flagship visual canvas orchestrating client interactions and secure database logic.", tasks: [{ id: "t1", text: "Configure deployment ports", done: true }, { id: "t2", text: "Deploy SSL certs", done: false }] },
      { id: "api", x: 380, y: 180, label: "Express API Backend", type: "info", color: "purple", parentId: "root", notes: "Secures authentication, schedules background items, and processes Stripe subscription flows." },
      { id: "db", x: 660, y: 100, label: "PostgreSQL Database", type: "info", color: "emerald", parentId: "api", notes: "Houses client profiles, system settings, and transactional records." },
      { id: "cache", x: 660, y: 240, label: "Redis Session Cache", type: "idea", color: "rose", parentId: "api", notes: "Stores rapid session keys and limits redundant database connections." },
      { id: "frontend", x: 380, y: 420, label: "Vite + Tailwind Front-end", type: "idea", color: "purple", parentId: "root", notes: "Renders modern styled layouts on standard interactive browser windows." },
      { id: "cdn", x: 660, y: 420, label: "Cloudflare Static Edge CDN", type: "info", color: "amber", parentId: "frontend", notes: "Caches image thumbnails, public css scripts, and js client bundles." }
    ]
  },
  ai_startup: {
    name: "💡 AI Startup Idea Canvas",
    description: "Brainstorm strategic pillars, target niches, and marketing strategies for raising early capital.",
    nodes: [
      { id: "root", x: 100, y: 300, label: "AI Customer Care Suite", type: "idea", color: "purple", notes: "An automated agency assistant responding to tickets and compiling answers from documents." },
      { id: "tech", x: 380, y: 150, label: "LLM Orchestration Layer", type: "info", color: "sky", parentId: "root", notes: "Uses Gemini Pro models with customized system instructions for reliable user grounding." },
      { id: "agents", x: 660, y: 80, label: "Task-Specific Agents", type: "idea", color: "emerald", parentId: "tech", notes: "Mini code run routines checking shipping tracking databases." },
      { id: "rag", x: 660, y: 220, label: "Vector Search Embedding", type: "info", color: "amber", parentId: "tech", notes: "Embeds product manuals using gemini-embedding-2-preview values." },
      { id: "go_to_market", x: 380, y: 450, label: "Marketing Campaign launch", type: "goal", color: "rose", parentId: "root" },
      { id: "ph", x: 660, y: 380, label: "Product Hunt Showcase", type: "task", color: "slate", parentId: "go_to_market", completed: false },
      { id: "cold", x: 660, y: 500, label: "Personalized cold emails", type: "task", color: "slate", parentId: "go_to_market", completed: true }
    ]
  },
  novel_writing: {
    name: "📚 Plot & Character Mindmap",
    description: "Map narratives, main character arcs, secrets, and world-building structures.",
    nodes: [
      { id: "root", x: 100, y: 300, label: "The Shattered Compass", type: "info", color: "rose", notes: "A thrilling sci-fi adventure tracking an archeologist on a synthetic desert comet." },
      { id: "protagonist", x: 380, y: 180, label: "Dr. Clara Sterling", type: "idea", color: "sky", parentId: "root", notes: "Highly intelligent archeologist seeking lost planetary coordinates. Flawed and superstitious." },
      { id: "motivation", x: 640, y: 120, label: "Unlock the Vault", type: "goal", color: "amber", parentId: "protagonist", notes: "Wants to access forbidden logs before coordinates evaporate." },
      { id: "secret", x: 640, y: 240, label: "Secret Origin Key", type: "question", color: "rose", parentId: "protagonist", notes: "Was secretly cloned in the celestial space labs." },
      { id: "antagonist", x: 380, y: 420, label: "Commander Silas Vance", type: "idea", color: "purple", parentId: "root", notes: "Brutal cybernetic enforcer. Desires power over space-lanes." },
      { id: "climax", x: 640, y: 420, label: "Collision course at Sun", type: "task", color: "emerald", parentId: "antagonist" }
    ]
  }
};

const DEFAULT_MAP: MindNode[] = [
  { id: "root", x: 150, y: 320, label: "MindFlow AI Workspace", type: "idea", color: "purple", notes: "Welcome to MindFlow AI. Drag nodes to move, use mouse wheel to scroll canvas, and use right tools to trigger server-side Gemini generation!" },
  { id: "tut1", x: 420, y: 180, label: "1. Infinite Visual Canvas", type: "info", color: "sky", parentId: "root", notes: "Hold left click on the empty grid to pan. Scroll to zoom. Drag individual cards directly to organize ideas." },
  { id: "tut2", x: 420, y: 320, label: "2. Server-Side AI Brainstorming", type: "goal", color: "emerald", parentId: "root", notes: "Select any node, and click 'Brainstorm Steps' on the right panel. Our server queries Gemini 3.5 Flash to expand details!" },
  { id: "tut3", x: 420, y: 460, label: "3. Fully Local Autosaver", type: "task", color: "amber", parentId: "root", completed: true, notes: "All maps instantly synchronize to LocalStorage. Export/Import maps using standard JSON files or load prebuilt templates." }
];

export default function App() {
  const [mapsList, setMapsList] = useState<MindMap[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string>('');
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Viewport scale & pan states
  const [panX, setPanX] = useState<number>(100);
  const [panY, setPanY] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(0.95);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // AI Loading & Status Panel states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiPromptInputValue, setAiPromptInputValue] = useState<string>('');
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [loadingTip, setLoadingTip] = useState<string>('');

  // Active Map context Object
  const currentMapObj = useMemo(() => {
    return mapsList.find(m => m.id === currentMapId) || null;
  }, [mapsList, currentMapId]);

  // Dynamic statistics calculations matching the Sleek design theme boxes
  const { totalWorkItems, doneWorkItems, completionProgress, remainingItems } = useMemo(() => {
    const totalSubTasksCount = nodes.reduce((acc, curr) => acc + (curr.tasks?.length || 0), 0);
    const doneSubTasksCount = nodes.reduce((acc, curr) => acc + (curr.tasks?.filter(t => t.done).length || 0), 0);
    const totalNodeTasks = nodes.filter(n => n.type === 'task').length;
    const doneNodeTasks = nodes.filter(n => n.type === 'task' && n.completed).length;

    const total = totalNodeTasks + totalSubTasksCount;
    const done = doneNodeTasks + doneSubTasksCount;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const remaining = total - done;

    return {
      totalWorkItems: total,
      doneWorkItems: done,
      completionProgress: total === 0 ? 0 : progress,
      remainingItems: remaining >= 0 ? remaining : 0
    };
  }, [nodes]);

  // Canvas interaction refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeDragRef = useRef<{ nodeId: string; startX: number; startY: number; startNodeX: number; startNodeY: number } | null>(null);


  // Auto tips for model queues
  const LOADING_TIPS = [
    "Thinking with Gemini 3.5 Flash...",
    "Brainstorming relevant concepts...",
    "Expanding interactive branching structure...",
    "Polishing structured diagrams...",
    "Consulting server workflows..."
  ];

  // Fetch server status on boot
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        setIsServerOnline(data.hasApiKey);
        if (!data.hasApiKey) {
          console.warn("Gemini API key is missing on backend.");
        }
      })
      .catch(err => {
        console.error("Failed to connect to backend api status:", err);
        setIsServerOnline(false);
      });
  }, []);

  // Initialize Maps List from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('mindflow_maps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MindMap[];
        setMapsList(parsed);
        if (parsed.length > 0) {
          setCurrentMapId(parsed[0].id);
          setNodes(parsed[0].nodes);
        } else {
          loadDefaultDemo();
        }
      } catch (e) {
        console.error("Corrupted LocalStorage maps, fallback to demo system.");
        loadDefaultDemo();
      }
    } else {
      loadDefaultDemo();
    }
  }, []);

  const loadDefaultDemo = () => {
    const mainSample: MindMap = {
      id: 'default_demo_flow',
      name: '💡 Get Started: MindFlow Tutorial',
      updatedAt: new Date().toISOString(),
      nodes: DEFAULT_MAP
    };
    const list = [mainSample];
    localStorage.setItem('mindflow_maps', JSON.stringify(list));
    setMapsList(list);
    setCurrentMapId(mainSample.id);
    setNodes(mainSample.nodes);
  };

  // Sync current map whenever nodes adjust
  const autosave = useCallback((updatedNodes: MindNode[]) => {
    if (!currentMapId) return;
    setMapsList(prevList => {
      const newList = prevList.map(m => {
        if (m.id === currentMapId) {
          return { ...m, nodes: updatedNodes, updatedAt: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem('mindflow_maps', JSON.stringify(newList));
      return newList;
    });
  }, [currentMapId]);

  const updateNodes = useCallback((newNodes: MindNode[]) => {
    setNodes(newNodes);
    autosave(newNodes);
  }, [autosave]);

  // Handle active node selection
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Loading animation triggers
  const startLoadingAnimation = () => {
    setIsGenerating(true);
    setGenerationError(null);
    setLoadingTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
    const interval = setInterval(() => {
      setLoadingTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
    }, 4500);
    return interval;
  };

  // Layout arrangement algorithm (vertical branch flow column representation)
  const handleAutoArrange = () => {
    if (nodes.length === 0) return;
    const nodeIds = new Set(nodes.map(n => n.id));
    const roots = nodes.filter(n => !n.parentId || !nodeIds.has(n.parentId));
    
    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]);
    }
    
    const updated = [...nodes];
    const spacingX = 280;
    const spacingY = 130;
    const depthCounts: Record<number, number> = {};
    
    const positionNode = (nodeId: string, depth: number) => {
      const idx = updated.findIndex(n => n.id === nodeId);
      if (idx === -1) return;
      
      if (depthCounts[depth] === undefined) {
        depthCounts[depth] = 0;
      }
      const count = depthCounts[depth];
      depthCounts[depth] += 1;
      
      updated[idx].x = 120 + depth * spacingX;
      updated[idx].y = 100 + count * spacingY;
      
      const children = updated.filter(n => n.parentId === nodeId);
      children.forEach(c => positionNode(c.id, depth + 1));
    };
    
    roots.forEach(root => positionNode(root.id, 0));
    
    // Center rows dynamically
    const maxDepth = Math.max(...Object.keys(depthCounts).map(Number), 0);
    const maxRows = Math.max(...Object.values(depthCounts), 1);
    const targetCenterY = (maxRows * spacingY) / 2;
    
    for (let d = 0; d <= maxDepth; d++) {
      const colSize = depthCounts[d] || 0;
      const colOffset = targetCenterY - (colSize * spacingY) / 2;
      updated.forEach(n => {
        const dLevel = Math.round((n.x - 120) / spacingX);
        if (dLevel === d) {
          n.y += colOffset;
        }
      });
    }
    
    updateNodes(updated);
    setPanX(80);
    setPanY(80);
    setZoom(0.85);
  };

  // Canvas background drag/pan hooks
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If user clicks on a node or sidebar, skip canvas dragging
    if ((e.target as HTMLElement).closest('.card-draggable') || (e.target as HTMLElement).closest('.sidebar-interactive')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (nodeDragRef.current) {
      const drag = nodeDragRef.current;
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;
      
      setNodes(prev => prev.map(n => {
        if (n.id === drag.nodeId) {
          return { ...n, x: Math.round(drag.startNodeX + dx), y: Math.round(drag.startNodeY + dy) };
        }
        return n;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (nodeDragRef.current) {
      autosave(nodes);
      nodeDragRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 0.93 : 1.07;
    setZoom(prev => Math.min(Math.max(0.3, prev * scale), 2.2));
  };

  // Node Drag Trigger
  const handleNodeDragStart = (e: React.MouseEvent, node: MindNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    nodeDragRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y
    };
  };

  // Standard interactive map gallery CRUD operations
  const handleCreateNewMap = () => {
    const newId = 'map_' + Date.now();
    const newMapObj: MindMap = {
      id: newId,
      name: '📂 New Mind Map Concept',
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: "root", x: 250, y: 280, label: "Core Concept Header", type: "idea", color: "purple", notes: "Click here to rename or brainstorm sub-elements." }
      ]
    };
    const updatedList = [newMapObj, ...mapsList];
    setMapsList(updatedList);
    localStorage.setItem('mindflow_maps', JSON.stringify(updatedList));
    setCurrentMapId(newId);
    setNodes(newMapObj.nodes);
    setSelectedNodeId("root");
    setPanX(150);
    setPanY(100);
    setZoom(0.95);
  };

  const handleDeleteMap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = mapsList.filter(m => m.id !== id);
    setMapsList(filtered);
    localStorage.setItem('mindflow_maps', JSON.stringify(filtered));
    if (currentMapId === id) {
      if (filtered.length > 0) {
        setCurrentMapId(filtered[0].id);
        setNodes(filtered[0].nodes);
      } else {
        // Safe reset if no maps remains
        const fresh: MindMap = {
          id: 'fresh_start',
          name: '🎯 Default Grid Workspace',
          updatedAt: new Date().toISOString(),
          nodes: [{ id: "root", x: 300, y: 300, label: "Clean Node", type: "idea", color: "purple" }]
        };
        const fl = [fresh];
        setMapsList(fl);
        setCurrentMapId('fresh_start');
        setNodes(fresh.nodes);
        localStorage.setItem('mindflow_maps', JSON.stringify(fl));
      }
    }
  };

  const handleRenameMapName = (id: string, nextName: string) => {
    const updated = mapsList.map(m => m.id === id ? { ...m, name: nextName, updatedAt: new Date().toISOString() } : m);
    setMapsList(updated);
    localStorage.setItem('mindflow_maps', JSON.stringify(updated));
  };

  const handleSwitchMapSelect = (id: string) => {
    const found = mapsList.find(m => m.id === id);
    if (found) {
      setCurrentMapId(id);
      setNodes(found.nodes);
      setSelectedNodeId(null);
    }
  };

  // Node customization updates
  const handleUpdateNodeProp = (prop: keyof MindNode, val: any) => {
    if (!selectedNodeId) return;
    const next = nodes.map(n => n.id === selectedNodeId ? { ...n, [prop]: val } : n);
    updateNodes(next);
  };

  // Node checklist editing
  const handleAddSubTask = (text: string) => {
    if (!selectedNode || !text.trim()) return;
    const currentTasks = selectedNode.tasks || [];
    const nextTasks = [...currentTasks, { id: 'task_' + Date.now(), text: text.trim(), done: false }];
    handleUpdateNodeProp('tasks', nextTasks);
  };

  const handleToggleSubTask = (taskId: string) => {
    if (!selectedNode || !selectedNode.tasks) return;
    const nextTasks = selectedNode.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    handleUpdateNodeProp('tasks', nextTasks);
  };

  const handleDeleteSubTask = (taskId: string) => {
    if (!selectedNode || !selectedNode.tasks) return;
    const nextTasks = selectedNode.tasks.filter(t => t.id !== taskId);
    handleUpdateNodeProp('tasks', nextTasks);
  };

  const handleAddNodeManual = (parentId?: string) => {
    const pid = parentId || undefined;
    const parentNodeObj = nodes.find(n => n.id === pid);
    
    // Spread sibling layouts cleanly
    const offsetAngle = Math.random() * Math.PI * 2;
    const xBase = parentNodeObj ? parentNodeObj.x + Math.cos(offsetAngle) * 180 : 300;
    const yBase = parentNodeObj ? parentNodeObj.y + Math.sin(offsetAngle) * 120 : 300;

    const freshNode: MindNode = {
      id: 'node_' + Date.now(),
      x: Math.round(xBase),
      y: Math.round(yBase),
      label: 'New Core Node',
      type: 'idea',
      color: parentNodeObj ? parentNodeObj.color : 'purple',
      parentId: pid,
      notes: ''
    };

    updateNodes([...nodes, freshNode]);
    setSelectedNodeId(freshNode.id);
  };

  const handleDeleteNodeManual = (id: string) => {
    const updated = nodes.filter(n => n.id !== id).map(n => {
      // Re-assign grandchildren to have parent's parent as link if applicable
      if (n.parentId === id) {
        const deletedNodeObj = nodes.find(target => target.id === id);
        return { ...n, parentId: deletedNodeObj?.parentId || undefined };
      }
      return n;
    });
    updateNodes(updated);
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Load predefined system templates
  const handleLoadTemplate = (key: string) => {
    const chosen = TEMPLATES[key];
    if (!chosen) return;

    const nextId = 'map_' + Date.now();
    const newMapObj: MindMap = {
      id: nextId,
      name: `📂 ${chosen.name.replace('🚀', '').replace('💡', '').replace('📚', '').trim()}`,
      updatedAt: new Date().toISOString(),
      nodes: JSON.parse(JSON.stringify(chosen.nodes)) // deep clone nodes
    };

    const nextList = [newMapObj, ...mapsList];
    setMapsList(nextList);
    localStorage.setItem('mindflow_maps', JSON.stringify(nextList));
    setCurrentMapId(nextId);
    setNodes(newMapObj.nodes);
    setSelectedNodeId(null);
    setPanX(150);
    setPanY(100);
    setZoom(0.85);
  };

  // Export mind map to a static JSON file
  const handleExportJSON = () => {
    const currentMap = mapsList.find(m => m.id === currentMapId);
    if (!currentMap) return;
    const textBlobStr = JSON.stringify(currentMap, null, 2);
    const blob = new Blob([textBlobStr], { type: 'application/json' });
    const localUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = localUrl;
    downloadAnchor.download = `${currentMap.name.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_')}_mindflow.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Import mind map from local JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const parsedMapObj = JSON.parse(resultText) as Partial<MindMap>;
        
        if (!parsedMapObj.name || !Array.isArray(parsedMapObj.nodes)) {
          alert("Invalid MindFlow JSON template format. Must declare name and nodes.");
          return;
        }

        const freshId = 'map_' + Date.now();
        const incomingMap: MindMap = {
          id: freshId,
          name: `📥 Imported: ${parsedMapObj.name}`,
          updatedAt: new Date().toISOString(),
          nodes: parsedMapObj.nodes.map(n => ({
            ...n,
            // Validate positions
            x: typeof n.x === 'number' ? n.x : 200,
            y: typeof n.y === 'number' ? n.y : 200,
          })) as MindNode[]
        };

        const list = [incomingMap, ...mapsList];
        setMapsList(list);
        localStorage.setItem('mindflow_maps', JSON.stringify(list));
        setCurrentMapId(freshId);
        setNodes(incomingMap.nodes);
        setSelectedNodeId(null);
        alert("Mind map successfully imported!");
      } catch (err) {
        alert("Failed to parse the chosen mind map JSON catalog file.");
      }
    };
    fileReader.readAsText(file);
  };

  // SSE or standard fetch request for Gemini text expansion
  const requestGeminiGeneration = async (prompt: string, instruction?: string, schema?: any) => {
    const r = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction: instruction,
        jsonSchema: schema
      })
    });
    
    if (!r.ok) {
      const errPayload = await r.json();
      throw new Error(errPayload.error || "The server-side API request returned an error status.");
    }
    
    return await r.json();
  };

  // 1. AI Mind Map Generator: Create entirely new structured diagram from scratch
  const handleAiGenerateCompleteMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInputValue.trim()) return;

    const loader = startLoadingAnimation();
    try {
      // Define a custom JSON schema matching type parameters safely
      const mindMapJsonSchema = {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Clear title of the mind map topic' },
          nodes: {
            type: 'ARRAY',
            description: 'List of nodes containing the hierarchical ideas. Minimum 6 nodes, maximum 10 nodes.',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING', description: 'Unique string token representation (e.g. n1, n2, n3)' },
                parentId: { type: 'STRING', description: 'The parent node id (e.g. root should have empty or null, child should refer to its parent)', nullable: true },
                label: { type: 'STRING', description: 'Concise name of 1-4 words maximum' },
                notes: { type: 'STRING', description: 'A helpful sentence summarizing this node' },
                type: { type: 'STRING', description: 'The semantic context indicator. Must choose exactly one of: idea, task, question, goal, info' },
                color: { type: 'STRING', description: 'Selected color coordinate match. Choose one of: purple, sky, emerald, rose, amber, slate' }
              },
              required: ['id', 'label', 'type', 'color']
            }
          }
        },
        required: ['title', 'nodes']
      };

      const promptCommand = `Generate a visually complete, useful, and fully interconnected mind-map schema outlining this topic: "${aiPromptInputValue}". Provide logical parentId variables to connect secondary ideas into a cohesive relational outline structure starting from a single overarching root node. Ensure the root is the only node without a parentId.`;

      const response = await requestGeminiGeneration(
        promptCommand,
        "You are a master conceptual business analyst and structured mind-mapping software companion. You return valid JSON matching the exact schema requesting node definitions.",
        mindMapJsonSchema
      );

      const parsedData = JSON.parse(response.text);
      if (!parsedData.nodes || parsedData.nodes.length === 0) {
        throw new Error("Gemini returned an empty node catalog.");
      }

      // Convert nodes cleanly, giving coordinates automatically
      const newlyCreatedNodes: MindNode[] = parsedData.nodes.map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type || 'idea',
        color: n.color || 'purple',
        notes: n.notes || '',
        parentId: n.parentId && n.parentId !== n.id ? n.parentId : undefined,
        x: 300,
        y: 300
      }));

      // Automatically organize the nodes on the coordinate map nicely
      const arranged = autoArrangeNodesLayout(newlyCreatedNodes);

      const nextId = 'map_' + Date.now();
      const freshMap: MindMap = {
        id: nextId,
        name: `✨ AI: ${parsedData.title || aiPromptInputValue}`,
        updatedAt: new Date().toISOString(),
        nodes: arranged
      };

      const updatedList = [freshMap, ...mapsList];
      setMapsList(updatedList);
      localStorage.setItem('mindflow_maps', JSON.stringify(updatedList));
      setCurrentMapId(nextId);
      setNodes(arranged);
      setSelectedNodeId(null);
      setAiPromptInputValue('');
      setPanX(150);
      setPanY(100);
      setZoom(0.85);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "An error occurred generating map structural JSON.");
    } finally {
      clearInterval(loader);
      setIsGenerating(false);
    }
  };

  // Fallback map positioner for newly generated AI cards
  const autoArrangeNodesLayout = (incomingNodes: MindNode[]): MindNode[] => {
    // Basic root finder
    const ids = new Set(incomingNodes.map(n => n.id));
    const roots = incomingNodes.filter(n => !n.parentId || !ids.has(n.parentId));
    if (roots.length === 0 && incomingNodes.length > 0) {
      roots.push(incomingNodes[0]);
    }

    const arrangedList = [...incomingNodes];
    const verticalGap = 130;
    const horizontalGap = 280;
    const depthLevelCounter: Record<number, number> = {};

    const recurseLayout = (nid: string, d: number) => {
      const idx = arrangedList.findIndex(x => x.id === nid);
      if (idx === -1) return;

      if (depthLevelCounter[d] === undefined) {
        depthLevelCounter[d] = 0;
      }
      const position = depthLevelCounter[d];
      depthLevelCounter[d] += 1;

      arrangedList[idx].x = 100 + d * horizontalGap;
      arrangedList[idx].y = 80 + position * verticalGap;

      const kids = arrangedList.filter(n => n.parentId === nid);
      kids.forEach(k => recurseLayout(k.id, d + 1));
    };

    roots.forEach(root => recurseLayout(root.id, 0));
    return arrangedList;
  };

  // 2. AI Brainstorm additions: Appends 3-4 child nodes branching out from selected card
  const handleAiBrainstormSubIdeas = async () => {
    if (!selectedNode) return;

    const loader = startLoadingAnimation();
    try {
      const childExpansionSchema = {
        type: 'OBJECT',
        properties: {
          ideas: {
            type: 'ARRAY',
            description: 'List of 3 distinct sub-branches or child ideas extending the starting concept card.',
            items: {
              type: 'OBJECT',
              properties: {
                label: { type: 'STRING', description: 'Short 2-4 word crisp title' },
                notes: { type: 'STRING', description: 'Brief explanation matching this aspect limit 15 words.' },
                type: { type: 'STRING', description: 'One of: idea, task, question, goal, info' },
                color: { type: 'STRING', description: 'One of: purple, sky, emerald, rose, amber, slate' }
              },
              required: ['label', 'notes', 'type', 'color']
            }
          }
        },
        required: ['ideas']
      };

      const systemCommand = `You are a micro brainstorming prompt helper. Your task is to output exactly 3 brilliant, contextual, and creative sub-components or sequential next steps expanding from this specific workspace item: Label: "${selectedNode.label}", Notes: "${selectedNode.notes || 'None Specified'}". Your output must be in valid structured JSON format matching the schema rules.`;

      const response = await requestGeminiGeneration(
        `Expand on this parent node: "${selectedNode.label}". Provide 3 logical branches.`,
        systemCommand,
        childExpansionSchema
      );

      const data = JSON.parse(response.text);
      if (!data.ideas || data.ideas.length === 0) {
        throw new Error("No brainstorm elements generated.");
      }

      // Add child elements visually near the selected card
      const radiansBase = Math.random() * Math.PI;
      const radiusDistance = 220;

      const expandedNodes: MindNode[] = data.ideas.map((idea: any, index: number) => {
        const theta = radiansBase + (index * (Math.PI / 3));
        return {
          id: `ai_node_${Date.now()}_${index}`,
          x: Math.round(selectedNode.x + Math.cos(theta) * radiusDistance),
          y: Math.round(selectedNode.y + Math.sin(theta) * (radiusDistance * 0.7)),
          label: idea.label,
          type: idea.type || 'idea',
          color: idea.color || selectedNode.color,
          parentId: selectedNode.id,
          notes: idea.notes || ''
        };
      });

      const nextCombined = [...nodes, ...expandedNodes];
      updateNodes(nextCombined);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Brainstorm generation failed.");
    } finally {
      clearInterval(loader);
      setIsGenerating(false);
    }
  };

  // 3. AI Outline Summary: Analyzes branch and populates rich summary notes
  const handleAiSummarizeDescendantBranch = async () => {
    if (!selectedNode) return;

    const loader = startLoadingAnimation();
    try {
      // Collect direct children and local narrative elements
      const directChildren = nodes.filter(n => n.parentId === selectedNode.id);
      const childSummaryList = directChildren.map(c => `- ${c.label} (${c.type}): ${c.notes || ''}`).join('\n');

      const promptMsg = `Synthesize a professional, concise executive summary paragraph (around 40-60 words) describing the focal concept: "${selectedNode.label}" and its branches:\n${childSummaryList || '- No explicit children yet'}. Keep it highly direct, practical, and clear.`;

      const response = await requestGeminiGeneration(
        promptMsg,
        "You are an executive assistant who summarizes complex organizational charts and brainstorming canvases with crisp precision. Return raw natural paragraphs."
      );

      if (response.text) {
        handleUpdateNodeProp('notes', response.text.trim());
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Summary prompt synthesis failed.");
    } finally {
      clearInterval(loader);
      setIsGenerating(false);
    }
  };

  // 4. AI Image Generation: Creates custom visual vector representations using gemini-2.5-flash-image
  const handleAiGenerateDoodleIcon = async () => {
    if (!selectedNode) return;

    const loader = startLoadingAnimation();
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedNode.label })
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "The server-side drawing endpoint returned an error.");
      }

      const payload = await response.json();
      if (payload.imageUrl) {
        handleUpdateNodeProp('imageUrl', payload.imageUrl);
      } else {
        throw new Error("Doodle base64 image field is missing.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate concept doodle.");
    } finally {
      clearInterval(loader);
      setIsGenerating(false);
    }
  };

  // Connect rendering logic: renders curved bezier connectors based on current nodes hierarchy
  const renderCanvasLinks = () => {
    const nodeLookup = new Map<string, MindNode>();
    nodes.forEach(n => nodeLookup.set(n.id, n));

    return nodes.map((child) => {
      if (!child.parentId) return null;
      const parent = nodeLookup.get(child.parentId);
      if (!parent) return null;

      // Calculate border-to-border offsets
      const px = parent.x + 105; // half card width estimate
      const py = parent.y + 40;  // approximate centerY
      const cx = child.x + 105;
      const cy = child.y + 40;

      // Smooth custom S-curve cubic bezier link
      const dx = Math.abs(cx - px) * 0.45;
      const controlX1 = px + (cx > px ? dx : -dx);
      const controlY1 = py;
      const controlX2 = cx + (cx > px ? -dx : dx);
      const controlY2 = cy;

      const dString = `M ${px} ${py} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${cx} ${cy}`;

      // Pick matching color gradient
      let linkColor = 'stroke-slate-200';
      if (parent.color === 'purple' || child.color === 'purple') linkColor = 'stroke-violet-200';
      else if (parent.color === 'sky' || child.color === 'sky') linkColor = 'stroke-indigo-200';
      else if (parent.color === 'emerald' || child.color === 'emerald') linkColor = 'stroke-emerald-200';
      else if (parent.color === 'rose' || child.color === 'rose') linkColor = 'stroke-rose-200';
      else if (parent.color === 'amber' || child.color === 'amber') linkColor = 'stroke-amber-200';

      return (
        <path
          key={`link_${parent.id}_to_${child.id}`}
          d={dString}
          className={`fill-none ${linkColor} transition-all duration-300`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="0"
        />
      );
    });
  };

  // Node Icon mapping base
  const getNodeIconMapping = (type: MindNode['type']) => {
    switch (type) {
      case 'idea': return <Lightbulb className="w-4 h-4 text-violet-600" />;
      case 'task': return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'question': return <HelpCircle className="w-4 h-4 text-rose-600" />;
      case 'goal': return <Target className="w-4 h-4 text-emerald-600" />;
      case 'info': return <FileText className="w-4 h-4 text-sky-600" />;
      default: return <CircleDot className="w-4 h-4" />;
    }
  };

  // Node Color CSS styles lookup matching study-card design guidelines
  const nodeColorStylesMap: Record<string, string> = {
    purple: 'bg-[#FAF5FF]/95 text-purple-950 border-purple-100 hover:ring-2 hover:ring-purple-200/60',
    sky: 'bg-[#F0F9FF]/95 text-sky-950 border-sky-100 hover:ring-2 hover:ring-sky-200/60',
    emerald: 'bg-[#ECFDF5]/95 text-emerald-950 border-emerald-100 hover:ring-2 hover:ring-emerald-200/60',
    rose: 'bg-[#FFF1F2]/95 text-rose-950 border-rose-100 hover:ring-2 hover:ring-rose-200/60',
    amber: 'bg-[#FFFBEB]/95 text-amber-950 border-amber-100 hover:ring-2 hover:ring-amber-200/60',
    slate: 'bg-[#F8FAFC]/95 text-slate-900 border-slate-200 hover:ring-2 hover:ring-slate-300/60'
  };

  return (
    <div className="flex w-screen h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none" id="mindflow-app-instance">
      
      {/* LEFT SIDEBAR: SAVED FLOWS & PREBUILT TEMPLATES */}
      <aside className="sidebar-interactive w-80 bg-white border-r border-slate-100 flex flex-col z-20 shrink-0 shadow-sm" id="left-control-sidebar">
        
        {/* Brand Banner */}
        <div className="p-5 border-b border-rose-100 bg-gradient-to-tr from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-violet-100 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">MindFlow AI</h1>
              <p className="text-[10px] text-slate-400 font-medium">Visual Thought Playground</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isServerOnline === true ? 'bg-emerald-500 shadow-md shadow-emerald-200' : isServerOnline === false ? 'bg-amber-500 shadow-md shadow-amber-200' : 'bg-slate-300'}`} title={isServerOnline === true ? "Web Server API Online" : "Secrets Config Required"} />
          </div>
        </div>

        {/* Saved Mind Maps Flow Collection */}
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Map Canvas</span>
              <button
                onClick={handleCreateNewMap}
                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition"
                id="btn-add-map-record"
                title="Create Blank Canvas"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-1">
              {mapsList.map(m => {
                const isActive = m.id === currentMapId;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSwitchMapSelect(m.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-200/50' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <Workflow className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleRenameMapName(m.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs w-full focus:bg-white focus:px-1 rounded focus:border-slate-300 outline-none truncate"
                      />
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteMap(m.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded-md transition"
                      title="Delete Map"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Templates Directory Accordion */}
          <div className="pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1.5 mb-3 px-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start from Template</span>
            </div>

            <div className="space-y-2">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleLoadTemplate(key)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50/60 hover:bg-gradient-to-tr hover:from-slate-50 hover:to-white border border-slate-100 hover:border-slate-200/80 transition-all flex flex-col gap-1 group"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition truncate">{template.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-2">{template.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Static Import / Export Anchors */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2">
          <button
            onClick={handleExportJSON}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition"
            id="export-map-json-button"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Flow as JSON
          </button>

          <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import Flow
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </aside>

      {/* MID CONTROLS: ZOOM, PAN & WORKSPACE STAGE */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden" id="main-interactive-canvas-viewport">
        
        {/* Sleek Top Navigation/Header Bar matching the campus study planner theme */}
        <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200/80 shrink-0 z-30 shadow-sm" id="sleek-top-navbar-control">
          <div className="flex flex-col min-w-0 max-w-sm md:max-w-md">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 truncate" id="navbar-planner-title">
              {currentMapObj ? currentMapObj.name.replace(/[💡🚀📚📂✨📥🎯]/g, '').trim() : "캠퍼스 스터디 플래너"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
              {currentMapObj ? `2026년 2학기 · Updated ${new Date(currentMapObj.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "2026년 2학기 · 10월 4주차"}
            </p>
          </div>
          
          {/* Middle: Integrated AI complete-map builder input form inside header bar */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <form
              onSubmit={handleAiGenerateCompleteMap}
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-full px-4 py-1.5 transition-all focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
              <input
                type="text"
                placeholder="Generate entire map using AI... (e.g. 'Sourdough Bread')"
                value={aiPromptInputValue}
                onChange={(e) => setAiPromptInputValue(e.target.value)}
                disabled={isGenerating}
                className="flex-1 text-xs bg-transparent border-none placeholder-slate-400 text-slate-700 outline-none p-0 focus:ring-0"
                id="ai-complete-map-prompter"
              />
              <button
                type="submit"
                disabled={isGenerating || !aiPromptInputValue.trim()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition shrink-0"
              >
                {isGenerating ? "Growing..." : "Grow Map"}
              </button>
            </form>
          </div>

          {/* Right Statistics Widgets EXACTLY matching the design HTML */}
          <div className="flex gap-4 shrink-0">
            <div className="bg-blue-50/80 px-4.5 py-1.5 rounded-2xl border border-blue-100 flex flex-col items-end min-w-[95px] shadow-sm">
              <span className="text-[9px] uppercase font-extrabold text-blue-600 tracking-wider">전체 진행률</span>
              <span className="text-lg font-mono font-black text-blue-700">{completionProgress}%</span>
            </div>
            <div className="bg-indigo-50/80 px-4.5 py-1.5 rounded-2xl border border-indigo-100 flex flex-col items-end min-w-[95px] shadow-sm">
              <span className="text-[9px] uppercase font-extrabold text-indigo-600 tracking-wider">남은 일정</span>
              <span className="text-lg font-mono font-black text-indigo-700">
                {String(remainingItems).padStart(2, '0')}
              </span>
            </div>
          </div>
        </nav>

        {/* Dynamic Grid Dot Pattern Background Viewport (relative flex-1) */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/10">
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              backgroundPosition: `${panX}px ${panY}px`,
            }}
            id="canvas-dots-container"
          >
            {/* Scaled/Translate Transform Layer incorporating both node-cards and lines SVG */}
            <div
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
              className="absolute inset-0 pointer-events-none transition-transform duration-75"
            >
              {/* Connection SVG curves */}
              <svg className="absolute inset-0 overflow-visible w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                {renderCanvasLinks()}
              </svg>

              {/* Individual Interactive HTML Card structures matching Sleek Theme */}
              {nodes.map(node => {
                const isSelected = node.id === selectedNodeId;
                const hasNotes = !!node.notes;
                const hasTasks = node.tasks && node.tasks.length > 0;
                const completeTaskCount = node.tasks ? node.tasks.filter(t => t.done).length : 0;
                const colorTheme = nodeColorStylesMap[node.color] || nodeColorStylesMap.purple;
                const isTaskDone = node.type === 'task' && node.completed;

                return (
                  <div
                    key={node.id}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onMouseDown={(e) => handleNodeDragStart(e, node)}
                    className={`card-draggable absolute w-[235px] rounded-[24px] border p-4.5 flex flex-col justify-between cursor-pointer select-none pointer-events-auto shadow-sm hover:shadow-md transition-all duration-300 group-node study-card-sleek ${
                      isTaskDone 
                        ? 'bg-slate-100/50 opacity-60 border-dashed border-slate-300 shadow-none' 
                        : isSelected 
                        ? 'ring-2 ring-indigo-500 scale-102 bg-white border-indigo-200 shadow-md shadow-indigo-100/40' 
                        : `${colorTheme} bg-white`
                    }`}
                    id={`node-card-${node.id}`}
                  >
                    <div>
                      {/* Category Pill Tag and Node Type Indicator */}
                      <div className="flex items-center justify-between gap-1 border-b border-slate-100/80 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {getNodeIconMapping(node.type)}
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500">
                            {node.type}
                          </span>
                        </div>
                        {node.type === 'task' && (
                          <span className={`w-2 h-2 rounded-full ${node.completed ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        )}
                      </div>

                      {/* Node Label Text */}
                      <div className="min-h-7 flex items-center mb-1">
                        <h3 className={`text-xs font-extrabold leading-snug break-words line-clamp-2 text-slate-800 tracking-tight ${isTaskDone ? 'line-through text-slate-400' : ''}`}>
                          {node.label || "Untitled concept"}
                        </h3>
                      </div>

                      {/* AI concept image thumbnail illustration if loaded */}
                      {node.imageUrl && (
                        <div className="w-full h-22 rounded-[16px] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 shadow-inner relative group/doodle mt-1.5">
                          <img src={node.imageUrl} alt="doodle" className="w-full h-full object-contain filter select-none pointer-events-none" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateNodeProp('imageUrl', undefined); }}
                            className="absolute top-1 right-1 opacity-0 group-hover/doodle:opacity-100 p-1 bg-slate-900/60 hover:bg-slate-900 text-white rounded-md transition"
                            title="Remove Image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Micro subtasks bar indicators */}
                      {hasTasks && (
                        <div className="flex items-center gap-1.5 mt-2 opacity-80">
                          <CheckSquare className="w-3 h-3 text-emerald-600" />
                          <span className="text-[9px] font-bold text-slate-500">{completeTaskCount}/{node.tasks?.length} steps done</span>
                        </div>
                      )}

                      {/* Micro Notes Icon indicator if comments exist */}
                      {hasNotes && (
                        <div className="text-[9.5px] text-slate-400 italic mt-2 border-t border-slate-100 pt-1.5 flex items-center gap-1 max-w-full">
                          <span className="font-semibold block truncate">{node.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Completion action status button matching design HTML */}
                    {node.type === 'task' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateNodeProp('completed', !node.completed);
                        }}
                        className={`mt-3.5 w-full py-1.5 border rounded-xl text-[10px] font-extrabold transition-all duration-200 ${
                          node.completed 
                            ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
                        }`}
                      >
                        {node.completed ? "완료됨" : "완료하기"}
                      </button>
                    )}

                    {/* Left / Right Add Node Anchor Handle bar pointers */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleAddNodeManual(node.id); }}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-slate-200 flex items-center justify-center opacity-0 group-hover-node:opacity-100 shadow-sm transition z-10 cursor-pointer"
                      title="Add Child Sub-node"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas floating quick helper controls at the bottom-right of viewport */}
          <div className="absolute bottom-5 right-5 z-20 pointer-events-auto bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200/60 p-1.5 flex gap-1 items-center" id="canvas-floating-controls">
            <button
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.15))}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.3, prev - 0.15))}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => { setZoom(0.95); setPanX(150); setPanY(80); }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition text-xs font-bold flex items-center gap-1"
              title="Recenter Camera"
            >
              <Maximize2 className="w-4.5 h-4.5" />
              Recenter
            </button>
            <span className="w-px h-5 bg-slate-150 mx-1" />
            <button
              onClick={handleAutoArrange}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              title="Distribute Column Hierarchy"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              Auto Align
            </button>
          </div>

          {/* BOTTOM RIGHT FLOATING QUICK ACCORDION TIPS */}
          <div className="absolute bottom-5 left-5 z-10 max-w-sm pointer-events-auto" id="bottom-info-cards">
            {isServerOnline === false && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 shadow-md flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold leading-relaxed">Server-side Secrets Missing</p>
                  <p className="text-[10px] text-amber-700/90 mt-0.5">Please click <b>Settings &gt; Secrets</b> to insert your <code>GEMINI_API_KEY</code>. Autosave and templates will still run fine offline!</p>
                </div>
              </div>
            )}
          </div>

          {/* MODEL COMPILER QUEUE CARD (VISIBLE DURING GENERATION) */}
          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-40 transition-all duration-300 animate-fade-in">
              <div className="p-7 rounded-3xl bg-white border border-slate-150 shadow-2xl max-w-xs flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 relative z-10 animate-pulse">
                    <Brain className="w-7 h-7" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-indigo-200 animate-ping opacity-25" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Unleashing Gemini</h4>
                  <p className="text-xs text-indigo-600 font-semibold mt-1 animate-pulse">{loadingTip}</p>
                </div>
                <p className="text-[10px] text-slate-400 max-w-xs italic leading-relaxed">Creating layered logical frameworks. Please stand by...</p>
              </div>
            </div>
          )}

          {/* GENERAL GENERATION ERROR DIALOG */}
          {generationError && (
            <div className="absolute top-5 right-5 z-30 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl max-w-sm shadow-lg flex gap-3 pointer-events-auto items-start">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold">API Integration Notice</p>
                <p className="text-[10px] text-rose-700/80 mt-1">{generationError}</p>
              </div>
              <button onClick={() => setGenerationError(null)} className="p-1 hover:bg-rose-100 rounded-md">
                <X className="w-3.5 h-3.5 text-rose-600" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR: NODE CUSTOM EDITOR & INSTANT AI CO-PILOT */}
      <aside className="sidebar-interactive w-[340px] bg-white border-l border-slate-100 flex flex-col z-20 shrink-0 shadow-sm" id="right-node-editor-sidebar">
        {selectedNode ? (
          <div className="flex-1 flex flex-col h-full min-h-0">
            
            {/* Header / Meta metadata */}
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Inspector</span>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md"
                title="Dismiss Selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable options body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              
              {/* Type selector pill sets */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categorization Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['idea', 'task', 'question', 'goal', 'info'] as const).map(t => {
                    const isActive = selectedNode.type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => handleUpdateNodeProp('type', t)}
                        className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold capitalize flex flex-col items-center gap-1 transition-all ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-900 border font-extrabold shadow-sm' : 'bg-slate-50/50 border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                      >
                        {getNodeIconMapping(t)}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task completion toggle if node is a task */}
              {selectedNode.type === 'task' && (
                <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Mark task accomplished</span>
                  <button
                    onClick={() => handleUpdateNodeProp('completed', !selectedNode.completed)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${selectedNode.completed ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${selectedNode.completed ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              {/* Title Input field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Label Header</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => handleUpdateNodeProp('label', e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold bg-slate-50/40"
                  placeholder="Enter core text..."
                />
              </div>

              {/* Node Color pallet */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Color family</label>
                <div className="flex items-center gap-2">
                  {Object.keys(nodeColorStylesMap).map(c => {
                    const isPicked = selectedNode.color === c;
                    const cbgLookup: Record<string, string> = {
                      purple: 'bg-indigo-300',
                      sky: 'bg-sky-300',
                      emerald: 'bg-emerald-300',
                      rose: 'bg-rose-300',
                      amber: 'bg-amber-300',
                      slate: 'bg-slate-300'
                    };
                    return (
                      <button
                        key={c}
                        onClick={() => handleUpdateNodeProp('color', c)}
                        className={`w-6 h-6 rounded-full ${cbgLookup[c]} flex items-center justify-center transition-all ${isPicked ? 'ring-2 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105 opacity-80'}`}
                        title={c}
                      >
                        {isPicked && <Check className="w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task sub-checklists inside the node */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-Steps Checklist</label>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{(selectedNode.tasks || []).length} items</span>
                </div>
                
                {/* Add task bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const inp = fd.get('taskText') as string;
                    if (inp) {
                      handleAddSubTask(inp);
                      e.currentTarget.reset();
                    }
                  }}
                  className="flex gap-1.5"
                >
                  <input
                    type="text"
                    name="taskText"
                    placeholder="Add step... (e.g. 'Draft index.css')"
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 focus:outline-none bg-slate-50/30"
                  />
                  <button type="submit" className="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition">
                    Add
                  </button>
                </form>

                {/* Checklist render loop */}
                <div className="space-y-1">
                  {(selectedNode.tasks || []).map(task => (
                    <div key={task.id} className="group/task flex items-center justify-between p-2 rounded-xl bg-slate-50/40 hover:bg-slate-50 border border-slate-100 transition-all">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleSubTask(task.id)}
                          className="w-3.5 h-3.5 text-indigo-600 focus:ring-0 rounded border-slate-300"
                        />
                        <span className={`text-[11px] leading-tight truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-600 font-medium'}`}>{task.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubTask(task.id)}
                        className="opacity-0 group-hover/task:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notebook long form field */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notebook / Description</label>
                <textarea
                  value={selectedNode.notes || ''}
                  onChange={(e) => handleUpdateNodeProp('notes', e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-28 bg-slate-50/40 leading-relaxed text-slate-600 font-medium"
                  placeholder="Insert custom paragraphs, research insights, or detailed criteria..."
                />
              </div>

              {/* Action Operations set */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAddNodeManual(selectedNode.id)}
                  className="w-full py-2 bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Link New Child Node
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteNodeManual(selectedNode.id)}
                  className="w-full py-2 bg-rose-50/40 hover:bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Node Card
                </button>
              </div>

            </div>

            {/* AI CO-PILOT FOOTER MODAL CONTROLS */}
            <div className="p-4 bg-gradient-to-tr from-indigo-50/70 to-white border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1 p-1">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Gemini Co-Pilot Actions</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAiBrainstormSubIdeas}
                  disabled={isGenerating}
                  className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl text-[10px] flex flex-col items-center gap-1 transition shadow-sm"
                  title="Expand Card with 3 Brand-new branch proposals"
                >
                  <Brain className="w-4 h-4 shrink-0" />
                  Brainstorm Steps
                </button>

                <button
                  onClick={handleAiSummarizeDescendantBranch}
                  disabled={isGenerating}
                  className="py-2.5 px-2 bg-white hover:bg-indigo-50/50 border border-indigo-200 disabled:border-slate-200 disabled:bg-slate-50 text-indigo-800 disabled:text-slate-400 font-bold rounded-xl text-[10px] flex flex-col items-center gap-1 transition"
                  title="Analyze sub-nodes and compile custom notebook briefing"
                >
                  <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                  Summarize Card
                </button>
              </div>

              <button
                onClick={handleAiGenerateDoodleIcon}
                disabled={isGenerating}
                className="w-full py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Generates a customized minimalist line art doodle matching your label string to represent this card!"
              >
                <Image className="w-4 h-4 text-violet-100" />
                Generate Concept Sketch
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300">
              <Workflow className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-700">No Concept Selected</h5>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">Select any card directly on the grid workspace to edit notes, track checklists, spawn custom sub-tasks, or trigger server-side Gemini generation.</p>
            </div>
            <button 
              onClick={() => handleAddNodeManual()}
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Standalone Card
            </button>
          </div>
        )}
      </aside>

    </div>
  );
}
