'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type NodeProps,
  type EdgeProps,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import charactersData from '@/data/series_characters.json';

/* ── 타입 정의 ── */
interface NodeData {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  personality: string;
  concern: string;
  situations: string[];
  familyColor: string;
  familyLabel: string;
  [key: string]: unknown;
}

/* ── 감정 타입 ── */
const EMOTION_TYPES = [
  { label: '로맨스',      color: '#db2777' },
  { label: '짝사랑',      color: '#9333ea' },
  { label: '착각',        color: '#7c3aed' },
  { label: '불륜',        color: '#dc2626' },
  { label: '금지된 감정', color: '#ea580c' },
  { label: '위로·의지',   color: '#0369a1' },
  { label: '집착',        color: '#4f46e5' },
  { label: '경쟁·질투',   color: '#b45309' },
  { label: '가족',        color: '#059669' },
  { label: '적대',        color: '#6b7280' },
];

/* ── 가정 색상 ── */
const FAMILY_COLORS: Record<string, string> = {
  park: '#7c3aed',
  kim:  '#2563eb',
  choi: '#0891b2',
};

const FAMILY_DARK_BG: Record<string, string> = {
  park: 'linear-gradient(145deg, #1e1040, #2d1b69)',
  kim:  'linear-gradient(145deg, #0f1e4a, #1e3a8a)',
  choi: 'linear-gradient(145deg, #0a2a3a, #0c4a6e)',
  sup:  'linear-gradient(145deg, #1a1a2e, #2d2d44)',
};

// 조연 그룹별 accent 색상
const SUP_GROUP_COLORS: Record<string, string> = {
  '이수진의 남매':    '#7c3aed',
  '최은정의 여동생':  '#2563eb',
  '동네 할아버지':    '#b45309',
  '동네 할머니':      '#be185d',
  '20~30대 1인 가구': '#0891b2',
  '직장 동료':        '#059669',
  '자영업자·소상공인':'#dc2626',
  '법조·금융·부동산': '#4f46e5',
  '다문화·이주 노동': '#0369a1',
  '상류층·기득권':    '#6b7280',
  '미디어·디지털':    '#9333ea',
};

const SUP_IDS = new Set(['park_brother_in_law', 'park_sister_in_law', 'kim_sister_in_law']);

function getFamilyDarkBg(id: string): string {
  if (SUP_IDS.has(id) || id.startsWith('sup_')) return FAMILY_DARK_BG.sup;
  if (id.startsWith('park')) return FAMILY_DARK_BG.park;
  if (id.startsWith('kim'))  return FAMILY_DARK_BG.kim;
  if (id.startsWith('choi')) return FAMILY_DARK_BG.choi;
  return FAMILY_DARK_BG.sup;
}

function getFamilyColor(id: string): string {
  if (id.startsWith('park')) return FAMILY_COLORS.park;
  if (id.startsWith('kim'))  return FAMILY_COLORS.kim;
  if (id.startsWith('choi')) return FAMILY_COLORS.choi;
  return '#6b7280';
}

/* ── 커스텀 노드 ── */
function CharacterNode({ data, selected }: NodeProps) {
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const nodeData = data as NodeData;
  const { familyColor, familyLabel, name, age, gender, occupation, situations, id: charId } = nodeData;
  const allSituations = [...(situations ?? []), ...added];
  const genderLabel = gender === 'male' ? '남' : '여';
  const darkBg = gender === 'male' ? '#555555' : '#333333';

  const handleAddSituation = async () => {
    const trimmed = inputVal.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/series/characters/situation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: charId, situation: trimmed }),
      });
      if (res.ok) {
        setAdded(prev => [...prev, trimmed]);
        setInputVal('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: darkBg,
        border: `2px solid ${selected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        color: 'rgba(255,255,255,0.9)',
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        position: 'relative',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Target Handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 12,
          height: 12,
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.5)',
          left: -7,
        }}
      />

      {/* 가정 뱃지 */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 700,
          background: familyColor,
          color: 'white',
          borderRadius: 6,
          padding: '2px 8px',
          letterSpacing: '0.05em',
        }}>
          {familyLabel}
        </span>
      </div>

      {/* 헤더: 이름 + 나이 + 성별 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.95)' }}>
          {name}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{age}세</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)',
            borderRadius: 4,
            padding: '1px 5px',
          }}
        >
          {genderLabel}
        </span>
      </div>

      {/* 직업 */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
        {occupation}
      </div>

      {/* 구분선 */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }} />

      {/* 상황 목록 (항상 표시) */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
          📋 상황 {allSituations.length}개
        </div>
        {allSituations.length > 0 && (
          <ul style={{ margin: '0 0 6px 0', padding: 0, listStyle: 'none' }}>
            {allSituations.map((s, i) => (
              <li
                key={i}
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.5,
                  marginBottom: 2,
                }}
              >
                · {s}
              </li>
            ))}
          </ul>
        )}
        {/* 상황 추가 입력 */}
        <div
          className="nodrag nopan"
          style={{ display: 'flex', gap: 4, marginTop: 4 }}
        >
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddSituation(); }}
            placeholder="새 상황 입력..."
            style={{
              flex: 1,
              fontSize: 10,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 5,
              padding: '3px 7px',
              color: 'rgba(255,255,255,0.85)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddSituation}
            disabled={!inputVal.trim() || saving}
            style={{
              background: 'rgba(124,58,237,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 5,
              color: 'white',
              fontSize: 14,
              fontWeight: 900,
              width: 28,
              height: 28,
              cursor: inputVal.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? '…' : '+'}
          </button>
        </div>
      </div>

      {/* Source Handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          background: familyColor,
          border: '2px solid white',
          right: -7,
        }}
      />
    </div>
  );
}

/* ── 커스텀 엣지 ── */
function EmotionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const edgeData = data as { label: string; color: string } | undefined;
  const color = edgeData?.color ?? '#6b7280';
  const label = edgeData?.label ?? '';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = useCallback(() => {
    setEdges(eds => eds.filter(e => e.id !== id));
  }, [id, setEdges]);

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: color, strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          className="nodrag nopan"
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.95)',
              color,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 6,
              border: `1px solid ${color}55`,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {label}
          </span>
          <button
            onClick={handleDelete}
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: `1px solid #e5e7eb`,
              borderRadius: '50%',
              color: '#9ca3af',
              cursor: 'pointer',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/* ── nodeTypes / edgeTypes (컴포넌트 외부 상수) ── */
const nodeTypes = { characterNode: CharacterNode };
const edgeTypes = { emotionEdge: EmotionEdge };

/* ── IndexedDB 유틸 ── */
const IDB_NAME = 'linkdrop_series';
const IDB_STORE = 'character_edges';
const IDB_KEY   = 'edges';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbSaveEdges(edges: Edge[]): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(JSON.stringify(edges), IDB_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function idbLoadEdges(): Promise<Edge[] | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        if (!req.result) return resolve(null);
        resolve(JSON.parse(req.result as string) as Edge[]);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/* ── 초기 노드 생성 ── */
interface RawMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  personality: string;
  concern: string;
  situations: string[];
}

// 노드 간격 상수 (세로 320px, 가로 360px)
const COL_GAP = 360;
const ROW_GAP = 320;
const ROW0   = 80;

const LAYOUT: Record<string, { x: number; y: number }> = {
  // ── 주연 (CENTER) ── col: 500 / 860 / 1220
  park_jh:               { x: 500,               y: ROW0           },
  park_sj:               { x: 500,               y: ROW0 + ROW_GAP },
  park_grandmother:      { x: 500,               y: ROW0 + ROW_GAP * 2 },
  park_son:              { x: 500,               y: ROW0 + ROW_GAP * 3 },

  kim_th:                { x: 500 + COL_GAP,     y: ROW0           },
  kim_ej:                { x: 500 + COL_GAP,     y: ROW0 + ROW_GAP },
  kim_grandfather:       { x: 500 + COL_GAP,     y: ROW0 + ROW_GAP * 2 },
  kim_daughter:          { x: 500 + COL_GAP,     y: ROW0 + ROW_GAP * 3 },

  choi_ms:               { x: 500 + COL_GAP * 2, y: ROW0           },
  choi_sy:               { x: 500 + COL_GAP * 2, y: ROW0 + ROW_GAP },
  choi_jh:               { x: 500 + COL_GAP * 2, y: ROW0 + ROW_GAP * 2 },
  choi_grandmother:      { x: 500 + COL_GAP * 2, y: ROW0 + ROW_GAP * 3 },
  choi_sister_in_law:    { x: 500 + COL_GAP * 2, y: ROW0 + ROW_GAP * 4 },

  // ── 남자 조연 (LEFT) ── col: 140 / -220 / -580
  park_brother_in_law:   { x: 140,               y: ROW0           },
  sup_gramps_1:          { x: 140,               y: ROW0 + ROW_GAP },
  sup_gramps_2:          { x: 140,               y: ROW0 + ROW_GAP * 2 },
  sup_gramps_3:          { x: 140,               y: ROW0 + ROW_GAP * 3 },
  sup_single_m1:         { x: 140,               y: ROW0 + ROW_GAP * 4 },

  sup_single_m2:         { x: 140 - COL_GAP,     y: ROW0           },
  sup_cw_1:              { x: 140 - COL_GAP,     y: ROW0 + ROW_GAP },
  sup_cw_3:              { x: 140 - COL_GAP,     y: ROW0 + ROW_GAP * 2 },
  sup_se_1:              { x: 140 - COL_GAP,     y: ROW0 + ROW_GAP * 3 },
  sup_se_3:              { x: 140 - COL_GAP,     y: ROW0 + ROW_GAP * 4 },

  sup_lg_2:              { x: 140 - COL_GAP * 2, y: ROW0           },
  sup_mg_2:              { x: 140 - COL_GAP * 2, y: ROW0 + ROW_GAP },
  sup_uc_2:              { x: 140 - COL_GAP * 2, y: ROW0 + ROW_GAP * 2 },
  sup_md_1:              { x: 140 - COL_GAP * 2, y: ROW0 + ROW_GAP * 3 },

  // ── 여자 조연 (RIGHT) ── col: 1580 / 1940 / 2300
  park_sister_in_law:    { x: 500 + COL_GAP * 3, y: ROW0           },
  kim_sister_in_law:     { x: 500 + COL_GAP * 3, y: ROW0 + ROW_GAP },
  sup_granny_1:          { x: 500 + COL_GAP * 3, y: ROW0 + ROW_GAP * 2 },
  sup_granny_2:          { x: 500 + COL_GAP * 3, y: ROW0 + ROW_GAP * 3 },
  sup_granny_3:          { x: 500 + COL_GAP * 3, y: ROW0 + ROW_GAP * 4 },

  sup_single_f1:         { x: 500 + COL_GAP * 4, y: ROW0           },
  sup_single_f2:         { x: 500 + COL_GAP * 4, y: ROW0 + ROW_GAP },
  sup_cw_2:              { x: 500 + COL_GAP * 4, y: ROW0 + ROW_GAP * 2 },
  sup_se_2:              { x: 500 + COL_GAP * 4, y: ROW0 + ROW_GAP * 3 },
  sup_lg_1:              { x: 500 + COL_GAP * 4, y: ROW0 + ROW_GAP * 4 },

  sup_lg_3:              { x: 500 + COL_GAP * 5, y: ROW0           },
  sup_mg_1:              { x: 500 + COL_GAP * 5, y: ROW0 + ROW_GAP },
  sup_uc_1:              { x: 500 + COL_GAP * 5, y: ROW0 + ROW_GAP * 2 },
  sup_md_2:              { x: 500 + COL_GAP * 5, y: ROW0 + ROW_GAP * 3 },
};

function buildInitialNodes(): Node<NodeData>[] {
  // 주연
  const familyMembers: RawMember[] = (charactersData.families as Array<{ members: RawMember[] }>)
    .flatMap(f => f.members);

  // 조연 — 그룹 색상 + 라벨 매핑용
  type SupportingGroup = { group: string; members: RawMember[] };
  const supGroups = charactersData.supporting as SupportingGroup[];
  const supColorById: Record<string, string> = {};
  const supLabelById: Record<string, string> = {};
  supGroups.forEach(g => {
    const color = SUP_GROUP_COLORS[g.group] ?? '#6b7280';
    g.members.forEach(m => {
      supColorById[m.id] = color;
      supLabelById[m.id] = g.group;
    });
  });
  const supMembers: RawMember[] = supGroups.flatMap(g => g.members);

  const allMembers = [...familyMembers, ...supMembers];

  const FAMILY_LABELS: Record<string, string> = {
    park: '박씨 가정',
    kim:  '김씨 가정',
    choi: '최씨 가정',
  };

  const result: Node<NodeData>[] = [];
  for (const [id, pos] of Object.entries(LAYOUT)) {
    const m = allMembers.find(member => member.id === id);
    if (!m) continue;
    const isSup = SUP_IDS.has(id) || id.startsWith('sup_');
    const familyColor = isSup
      ? (supColorById[id] ?? '#6b7280')
      : getFamilyColor(id);
    const familyLabel = isSup
      ? (supLabelById[id] ?? '조연')
      : (Object.entries(FAMILY_LABELS).find(([prefix]) => id.startsWith(prefix))?.[1] ?? '');
    result.push({
      id,
      type: 'characterNode',
      position: pos,
      data: {
        id,
        name: m.name,
        age: m.age,
        gender: m.gender,
        occupation: m.occupation,
        personality: m.personality,
        concern: m.concern,
        situations: m.situations ?? [],
        familyColor,
        familyLabel,
      },
    });
  }
  return result;
}

/* ── 감정선 선택 팝업 ── */
interface EdgeTypePopupProps {
  sourceLabel: string;
  targetLabel: string;
  onSelect: (label: string, color: string) => void;
  onCancel: () => void;
}

function EdgeTypePopup({ sourceLabel, targetLabel, onSelect, onCancel }: EdgeTypePopupProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          zIndex: 999,
        }}
      />
      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 16,
          padding: 24,
          zIndex: 1000,
          minWidth: 320,
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
          }}
        >
          감정선 타입을 선택하세요
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 16,
          }}
        >
          {sourceLabel} → {targetLabel}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {EMOTION_TYPES.map(em => (
            <button
              key={em.label}
              onClick={() => onSelect(em.label, em.color)}
              style={{
                background: 'transparent',
                border: `1px solid ${em.color}`,
                borderRadius: 8,
                color: em.color,
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = em.color;
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = em.color;
              }}
            >
              {em.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              color: '#6b7280',
              fontSize: 12,
              padding: '5px 16px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 내부 플로우 컴포넌트 ── */
interface PendingConnection {
  connection: Connection;
  sourceLabel: string;
  targetLabel: string;
}

function CharactersFlow() {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState<Node<NodeData>>(buildInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마운트 시 IndexedDB에서 엣지 복원
  useEffect(() => {
    idbLoadEdges().then(saved => {
      if (saved && saved.length > 0) setEdges(saved);
      setDbReady(true);
    });
  }, [setEdges]);

  // 엣지 변경 시 IndexedDB에 저장 (300ms 디바운스)
  useEffect(() => {
    if (!dbReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { idbSaveEdges(edges); }, 300);
  }, [edges, dbReady]);

  const handleComplete = useCallback(() => {
    const serialized = edges.map(e => ({
      id: e.id,
      fromId: e.source,
      toId: e.target,
      type: (e.data as { label: string; color: string } | undefined)?.label ?? '',
      color: (e.data as { label: string; color: string } | undefined)?.color ?? '#6b7280',
    }));
    sessionStorage.setItem('series_edges', JSON.stringify(serialized));
    router.push('/series/world');
  }, [edges, router]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      setPendingConnection({
        connection,
        sourceLabel: (sourceNode?.data as NodeData | undefined)?.name ?? '',
        targetLabel: (targetNode?.data as NodeData | undefined)?.name ?? '',
      });
    },
    [nodes],
  );

  const handleSelectEmotion = useCallback(
    (emotionLabel: string, color: string) => {
      if (!pendingConnection) return;
      setEdges(eds =>
        addEdge(
          {
            ...pendingConnection.connection,
            id: `${pendingConnection.connection.source}-${pendingConnection.connection.target}-${Date.now()}`,
            type: 'emotionEdge',
            data: { label: emotionLabel, color },
            animated: false,
          },
          eds,
        ),
      );
      setPendingConnection(null);
    },
    [pendingConnection, setEdges],
  );

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 52px)', marginTop: 52, background: '#f0f4ff', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 40%, #f0fdf4 100%)' }}
        connectionLineStyle={{ stroke: '#7c3aed', strokeWidth: 2.5 }}
        deleteKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#c4b5fd44"
        />
        <Controls
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        />
        <MiniMap
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,23,42,0.08)' }}
          nodeColor={n => getFamilyColor(n.id as string)}
          maskColor="rgba(124,58,237,0.05)"
        />

        {/* 페이지 타이틀 패널 */}
        <Panel position="top-left">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            borderRadius: 10, padding: '7px 14px',
          }}>
            <span style={{ background: '#ec4899', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em' }}>04</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>캐릭터 감정선</span>
          </div>
        </Panel>

        {/* 완료 버튼 패널 */}
        <Panel position="top-right">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <button
              onClick={handleComplete}
              style={{
                background: edges.length > 0
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : 'rgba(255,255,255,0.7)',
                color: edges.length > 0 ? 'white' : '#9ca3af',
                border: edges.length > 0 ? 'none' : '1px solid rgba(15,23,42,0.1)',
                borderRadius: 10,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: edges.length > 0 ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              완료 — 세계관으로 반영 →
            </button>
            {edges.length > 0 && (
              <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, paddingRight: 4 }}>
                감정선 {edges.length}개 연결됨
              </span>
            )}
          </div>
        </Panel>

        {/* 가정 범례 패널 */}
        <Panel position="top-left">
          <div
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>
              인물 관계 에디터
            </div>
            {[
              { label: '박씨 가정', color: FAMILY_COLORS.park },
              { label: '김씨 가정', color: FAMILY_COLORS.kim },
              { label: '최씨 가정', color: FAMILY_COLORS.choi },
              { label: '조연', color: '#6b7280' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />
                <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>
                  {item.label}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              노드 우측 핸들을 드래그해<br />감정선을 연결하세요
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {pendingConnection && (
        <EdgeTypePopup
          sourceLabel={pendingConnection.sourceLabel}
          targetLabel={pendingConnection.targetLabel}
          onSelect={handleSelectEmotion}
          onCancel={() => setPendingConnection(null)}
        />
      )}
    </div>
  );
}

/* ── 페이지 (ReactFlowProvider 래핑) ── */
export default function CharactersPage() {
  return (
    <ReactFlowProvider>
      <CharactersFlow />
    </ReactFlowProvider>
  );
}
