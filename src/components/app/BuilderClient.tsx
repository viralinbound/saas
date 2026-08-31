"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product, Store } from "@/lib/types";
import {
  BLOCK_LIBRARY,
  SHAPE_PRESETS,
  THEME_SWATCHES,
  newBlock,
  pid,
  type Block,
  type BlockStyle,
  type BlockType,
  type Page,
  type SiteConfig,
} from "@/lib/builder";
import { V2Storefront } from "@/components/builder/V2Storefront";
import { BlockRenderer } from "@/components/builder/BlockRenderer";
import type { PlanFeatures } from "@/lib/plan";

type SaveState = "idle" | "saving" | "saved" | "error";
type FieldType = "text" | "textarea" | "number" | "email" | "phone" | "date" | "checkbox";
export type CollectionMeta = {
  id: string;
  key: string;
  name: string;
  fields: { key: string; label: string; type: FieldType }[];
  recordCount?: number;
  allow_public_submit?: boolean;
  is_public?: boolean;
  require_login?: boolean;
};

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FIELD_TYPES: FieldType[] = ["text", "textarea", "number", "email", "phone", "date", "checkbox"];

export function BuilderClient({
  store,
  initialSite,
  products,
  publishedAt,
  gate,
  initialCollections,
}: {
  store: { id: string; name: string; slug: string; status: string; accentColor: string; brand: string; brandedHost: string; hostedPath?: string };
  initialSite: SiteConfig;
  products: Product[];
  publishedAt: string | null;
  gate: PlanFeatures;
  initialCollections: CollectionMeta[];
}) {
  const canBlocks = gate.builderBlocks;
  const canStyle = gate.sectionStyleEditor;
  const canPages = gate.multiPage;
  const canData = gate.dataCollections;
  const [collections, setCollections] = useState<CollectionMeta[]>(initialCollections);
  const [collMgr, setCollMgr] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaPick, setMediaPick] = useState<null | ((url: string) => void)>(null);

  const refreshCollections = useCallback(async () => {
    try {
      const r = await fetch("/api/collections");
      const d = await r.json();
      if (Array.isArray(d.collections)) setCollections(d.collections);
    } catch {}
  }, []);
  const [site, setSite] = useState<SiteConfig>(initialSite);
  const [activePageId, setActivePageId] = useState(initialSite.pages[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [canvasView, setCanvasView] = useState<"visual" | "layers">("visual");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const [publishing, setPublishing] = useState(false);
  const dragRef = useRef<{ id: string; col: number | null } | null>(null);
  const firstRender = useRef(true);

  const page = useMemo(() => site.pages.find((p) => p.id === activePageId) ?? site.pages[0], [site, activePageId]);

  // ── undo / redo history ─────────────────────────────────────────────
  const history = useRef<{ past: SiteConfig[]; future: SiteConfig[] }>({ past: [], future: [] });
  const skipHistory = useRef(false);
  const prevSite = useRef(site);
  const [, setHistTick] = useState(0);
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; prevSite.current = site; return; }
    if (prevSite.current !== site) {
      history.current.past.push(prevSite.current);
      if (history.current.past.length > 60) history.current.past.shift();
      history.current.future = [];
      prevSite.current = site;
      setHistTick((t) => t + 1);
    }
  }, [site]);
  const undo = useCallback(() => {
    const h = history.current;
    if (!h.past.length) return;
    const prev = h.past.pop()!;
    h.future.unshift(prevSite.current);
    skipHistory.current = true;
    setSite(prev);
    setHistTick((t) => t + 1);
  }, []);
  const redo = useCallback(() => {
    const h = history.current;
    if (!h.future.length) return;
    const next = h.future.shift()!;
    h.past.push(prevSite.current);
    skipHistory.current = true;
    setSite(next);
    setHistTick((t) => t + 1);
  }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // ── style patch on the selected block (used by the visual canvas) ────
  const patchStyle = useCallback((id: string, style: Partial<BlockStyle>) => {
    setSite((s) => ({
      ...s,
      pages: s.pages.map((pg) =>
        pg.id !== activePageId ? pg : {
          ...pg,
          blocks: pg.blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, ...style } } : b)),
        }
      ),
    }));
  }, [activePageId]);

  // ── debounced autosave ────────────────────────────────────────────────
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/builder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [site]);

  // ── page + block mutation helpers ────────────────────────────────────
  const mutatePage = useCallback((fn: (p: Page) => Page) => {
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === activePageId ? fn(p) : p)) }));
  }, [activePageId]);

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    const walk = (list: Block[]): Block[] =>
      list.map((b) => {
        if (b.id === id) return { ...b, ...patch, props: patch.props ? { ...b.props, ...patch.props } : b.props, style: patch.style ? { ...b.style, ...patch.style } : b.style };
        if (b.children) return { ...b, children: b.children.map(walk) };
        return b;
      });
    mutatePage((p) => ({ ...p, blocks: walk(p.blocks) }));
  }, [mutatePage]);

  const removeBlock = useCallback((id: string) => {
    const walk = (list: Block[]): Block[] =>
      list.filter((b) => b.id !== id).map((b) => (b.children ? { ...b, children: b.children.map(walk) } : b));
    mutatePage((p) => ({ ...p, blocks: walk(p.blocks) }));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, [mutatePage]);

  const duplicateBlock = useCallback((id: string) => {
    const clone = (b: Block): Block => ({
      ...newBlock(b.type),
      props: { ...b.props },
      style: { ...b.style },
      ...(b.children ? { children: b.children.map((col) => col.map(clone)) } : {}),
    });
    const walk = (list: Block[]): Block[] => {
      const out: Block[] = [];
      for (const b of list) {
        out.push(b.children ? { ...b, children: b.children.map(walk) } : b);
        if (b.id === id) out.push(clone(b));
      }
      return out;
    };
    mutatePage((p) => ({ ...p, blocks: walk(p.blocks) }));
  }, [mutatePage]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    mutatePage((p) => {
      const i = p.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.blocks.length) return p;
      const next = [...p.blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, blocks: next };
    });
  }, [mutatePage]);

  const toggleHidden = useCallback((id: string) => {
    mutatePage((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, hidden: !b.style.hidden } } : b)),
    }));
  }, [mutatePage]);

  const addBlock = useCallback((type: BlockType) => {
    if (!canBlocks) return;
    const b = newBlock(type);
    if (selectedCol !== null && selectedId) {
      // add into the selected column of the selected columns-block
      mutatePage((p) => ({
        ...p,
        blocks: p.blocks.map((blk) =>
          blk.id === selectedId && blk.children
            ? { ...blk, children: blk.children.map((col, i) => (i === selectedCol ? [...col, b] : col)) }
            : blk
        ),
      }));
    } else {
      mutatePage((p) => ({ ...p, blocks: [...p.blocks, b] }));
    }
    setSelectedId(b.id);
    setSelectedCol(null);
  }, [mutatePage, selectedCol, selectedId, canBlocks]);

  // ── drag to reorder within a list ───────────────────────────────────
  function onDrop(targetId: string, col: number | null) {
    const src = dragRef.current;
    dragRef.current = null;
    if (!src || src.id === targetId || src.col !== col) return;
    const reorder = (list: Block[]) => {
      const from = list.findIndex((b) => b.id === src.id);
      const to = list.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    };
    if (col === null) {
      mutatePage((p) => ({ ...p, blocks: reorder(p.blocks) }));
    } else if (selectedId) {
      mutatePage((p) => ({
        ...p,
        blocks: p.blocks.map((blk) =>
          blk.children && blk.id === dragParentId(p.blocks, src.id)
            ? { ...blk, children: blk.children.map((c, i) => (i === col ? reorder(c) : c)) }
            : blk
        ),
      }));
    }
  }

  // ── page ops ────────────────────────────────────────────────────────
  function addPage() {
    if (!canPages) return;
    const n = site.pages.length + 1;
    const p: Page = { id: pid(), name: `Page ${n}`, path: `page-${n}`, blocks: [] };
    setSite((s) => ({ ...s, pages: [...s.pages, p] }));
    setActivePageId(p.id);
    setSelectedId(null);
  }
  function renamePage(id: string, name: string) {
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)) }));
  }
  function setPagePath(id: string, path: string) {
    const clean = path.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === id ? { ...p, path: clean } : p)) }));
  }
  function deletePage(id: string) {
    if (site.pages.length <= 1) return;
    setSite((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) }));
    setActivePageId((cur) => (cur === id ? site.pages.find((p) => p.id !== id)!.id : cur));
  }

  async function publish() {
    setPublishing(true);
    setPublishMsg("");
    try {
      const res = await fetch("/api/design/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: store.brand }),
      });
      const d = await res.json();
      setPublishMsg(res.ok ? `Published → ${d.url || `https://www.supershowroom.in${store.hostedPath ?? ""}`}` : d.error || "Publish failed");
    } catch {
      setPublishMsg("Publish failed");
    }
    setPublishing(false);
  }

  const selected = useMemo(() => (selectedId ? findBlock(page?.blocks ?? [], selectedId) : null), [page, selectedId]);

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="ssr-builder" style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "calc(100vh - 0px)", minHeight: 600 }}>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>Website builder</strong>
        <span className="ssr-builder-host" style={{ fontSize: 11, fontFamily: MONO, color: "#64748B" }}>www.supershowroom.in{store.hostedPath ?? ""}</span>
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          <button type="button" onClick={() => setMode("edit")} style={tab(mode === "edit")}>Edit</button>
          <button type="button" onClick={() => setMode("preview")} style={tab(mode === "preview")}>Preview</button>
        </div>
        {mode === "edit" && (
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" onClick={undo} disabled={!history.current.past.length} title="Undo (Ctrl+Z)" style={{ ...tab(false), opacity: history.current.past.length ? 1 : 0.4 }}>↶ Undo</button>
            <button type="button" onClick={redo} disabled={!history.current.future.length} title="Redo (Ctrl+Shift+Z)" style={{ ...tab(false), opacity: history.current.future.length ? 1 : 0.4 }}>↷ Redo</button>
          </div>
        )}
        {(mode === "preview" || mode === "edit") && (
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" onClick={() => setDevice("desktop")} style={tab(device === "desktop")}>Desktop</button>
            <button type="button" onClick={() => setDevice("mobile")} style={tab(device === "mobile")}>Mobile</button>
          </div>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: saveState === "error" ? "#B91C1C" : "#16A34A", fontWeight: 700 }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : saveState === "error" ? "Save failed — retrying on next edit" : publishedAt ? "Loaded" : "Draft"}
        </span>
        <button type="button" onClick={publish} disabled={publishing} style={{ border: 0, background: "#24457A", color: "#fff", padding: "9px 16px", fontWeight: 800, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>
      {publishMsg && <div style={{ padding: "8px 16px", background: "#F0FDF4", borderBottom: "1px solid #86EFAC", fontSize: 12, fontWeight: 600 }}>{publishMsg}</div>}

      {mode === "preview" ? (
        <div style={{ overflow: "auto", background: "#EEF1F4", padding: 20 }}>
          <div style={{ width: device === "mobile" ? 390 : "100%", maxWidth: "100%", margin: "0 auto", border: "1px solid #E4E1DA", background: "#fff" }}>
            <V2Storefront
              store={{ ...(store as unknown as Store), products }}
              site={site}
              pagePath={page?.path ?? ""}
              accent={store.accentColor}
              editable
            />
          </div>
        </div>
      ) : (
        <div className="ssr-builder-cols" style={{ display: "grid", gridTemplateColumns: "230px 1fr 300px", overflow: "hidden" }}>
          {/* LEFT — pages + palette */}
          <div className="ssr-builder-pane" style={{ borderRight: "1px solid #E4E1DA", overflow: "auto", padding: 12, background: "#FAF9F6" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>Pages</div>
            <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
              {site.pages.map((p) => (
                <button key={p.id} type="button" onClick={() => { setActivePageId(p.id); setSelectedId(null); }}
                  style={{ textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "1px solid " + (p.id === activePageId ? "#24457A" : "#E4E1DA"), background: p.id === activePageId ? "#EEF2F8" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  {p.name}
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: MONO }}>/{p.path || ""}</div>
                </button>
              ))}
            </div>
            {canPages ? (
              <button type="button" onClick={addPage} style={{ marginTop: 8, width: "100%", border: "1px dashed #94A3B8", background: "transparent", padding: 8, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add page</button>
            ) : (
              <div style={{ marginTop: 8, fontSize: 11, color: "#B45309", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: 8 }}>
                Multi-page sites unlock on <strong>Essential</strong>.
              </div>
            )}

            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO, marginTop: 20 }}>
              Blocks {selectedCol !== null ? `→ column ${selectedCol + 1}` : ""}
            </div>
            {canBlocks ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
                {BLOCK_LIBRARY.map((b) => (
                  <button key={b.type} type="button" onClick={() => addBlock(b.type)}
                    style={{ border: "1px solid #E4E1DA", background: "#fff", padding: "8px 4px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "grid", gap: 2, justifyItems: "center" }}>
                    <span style={{ fontSize: 15 }}>{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 11, color: "#B45309", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: 10 }}>
                On the free plan you can edit the text of existing blocks. Adding, rearranging and deleting blocks unlocks on <strong>Essential</strong>; full colour &amp; spacing styling on <strong>Pro Showroom</strong>.
              </div>
            )}

            {canBlocks && (
              <>
                <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO, marginTop: 20 }}>Media</div>
                <button type="button" onClick={() => setMediaOpen(true)} style={{ marginTop: 8, width: "100%", border: "1px solid #24457A", background: "#EEF2F8", color: "#24457A", padding: 8, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                  Media library
                </button>
              </>
            )}

            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO, marginTop: 20 }}>Database</div>
            {canData ? (
              <>
                <button type="button" onClick={() => setCollMgr(true)} style={{ marginTop: 8, width: "100%", border: "1px solid #24457A", background: "#EEF2F8", color: "#24457A", padding: 8, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                  Manage collections
                </button>
                <div style={{ marginTop: 6, display: "grid", gap: 3 }}>
                  {collections.map((c) => (
                    <div key={c.id} style={{ fontSize: 11, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: MONO }}>{c.key}</span>
                      <span>{c.recordCount ?? 0} rows</span>
                    </div>
                  ))}
                  {collections.length === 0 && <div style={{ fontSize: 11, color: "#94A3B8" }}>No collections yet.</div>}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 8, fontSize: 11, color: "#B45309", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: 8 }}>
                Custom data collections unlock on <strong>Pro Showroom</strong>.
              </div>
            )}
          </div>

          {/* CENTER — visual canvas / layers */}
          <div className="ssr-builder-canvas" style={{ overflow: "auto", padding: 16, background: "#EEF1F4" }}>
            <div className="ssr-editor-note">Tip: drag-and-drop is easiest on a laptop. On a phone, use each block&apos;s ↑ ↓ buttons to reorder — everything else (add, edit, publish) works here.</div>
            {page && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input value={page.name} onChange={(e) => renamePage(page.id, e.target.value)} style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: "6px 10px", fontWeight: 800, fontSize: 14 }} />
                <span style={{ fontSize: 12, color: "#64748B", fontFamily: MONO }}>/</span>
                <input value={page.path} onChange={(e) => setPagePath(page.id, e.target.value)} placeholder="home" style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: "6px 10px", fontFamily: MONO, fontSize: 12, width: 120 }} />
                <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                  <button type="button" onClick={() => setCanvasView("visual")} style={tab(canvasView === "visual")}>Visual</button>
                  <button type="button" onClick={() => setCanvasView("layers")} style={tab(canvasView === "layers")}>Layers</button>
                </div>
                {site.pages.length > 1 && (
                  <button type="button" onClick={() => deletePage(page.id)} style={{ marginLeft: "auto", border: "1px solid #FCA5A5", color: "#B91C1C", background: "#fff", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Delete page</button>
                )}
              </div>
            )}

            {(page?.blocks ?? []).length === 0 ? (
              <div style={{ border: "2px dashed #CBD5E1", borderRadius: 10, padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>
                {canBlocks ? "Pick a block on the left to start building this page." : "This page has no blocks. Upgrade to Essential to add blocks."}
              </div>
            ) : canvasView === "layers" ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(page?.blocks ?? []).map((b) => (
                  <BlockRow
                    key={b.id}
                    block={b}
                    selectedId={selectedId}
                    canEdit={canBlocks}
                    onSelect={(id, col) => { setSelectedId(id); setSelectedCol(col ?? null); }}
                    onDelete={removeBlock}
                    onDuplicate={duplicateBlock}
                    onToggleHidden={toggleHidden}
                    dragRef={dragRef}
                    onDrop={onDrop}
                  />
                ))}
              </div>
            ) : (
              <div style={{ width: device === "mobile" ? 390 : "100%", maxWidth: "100%", margin: "0 auto" }}>
                <VisualCanvas
                  page={page!}
                  ctx={{ storeSlug: store.slug, products, accent: store.accentColor, currency: "INR", search: "", setSearch: () => {}, addToCart: () => {} }}
                  selectedId={selectedId}
                  canEdit={canBlocks}
                  snap={8}
                  onSelect={(id) => { setSelectedId(id); setSelectedCol(null); }}
                  onMove={moveBlock}
                  onDuplicate={duplicateBlock}
                  onDelete={removeBlock}
                  onReorder={(fromId, toId) => { dragRef.current = { id: fromId, col: null }; onDrop(toId, null); }}
                  onFree={(id, x, y) => patchStyle(id, { free: true, x, y })}
                />
              </div>
            )}
          </div>

          {/* RIGHT — inspector */}
          <div className="ssr-builder-pane" style={{ borderLeft: "1px solid #E4E1DA", overflow: "auto", padding: 14, background: "#FAF9F6" }}>
            {!selected ? (
              <p style={{ fontSize: 12, color: "#64748B" }}>Select a block to edit its content{canStyle ? " and style" : ""}.</p>
            ) : (
              <Inspector
                block={selected}
                canStyle={canStyle}
                collections={collections}
                onChange={(patch) => updateBlock(selected.id, patch)}
                onPickMedia={canBlocks ? (setter) => setMediaPick(() => setter) : undefined}
              />
            )}
          </div>
        </div>
      )}

      {collMgr && (
        <CollectionsManager
          collections={collections}
          onClose={() => setCollMgr(false)}
          onChanged={refreshCollections}
        />
      )}

      {(mediaOpen || mediaPick) && (
        <MediaLibrary
          picking={!!mediaPick}
          onPick={(url) => { mediaPick?.(url); setMediaPick(null); setMediaOpen(false); }}
          onClose={() => { setMediaPick(null); setMediaOpen(false); }}
        />
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────
function tab(active: boolean): React.CSSProperties {
  return { border: "1px solid " + (active ? "#24457A" : "#E4E1DA"), background: active ? "#24457A" : "#fff", color: active ? "#fff" : "#14161A", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 };
}
function findBlock(list: Block[], id: string): Block | null {
  for (const b of list) {
    if (b.id === id) return b;
    if (b.children) for (const col of b.children) { const f = findBlock(col, id); if (f) return f; }
  }
  return null;
}
function dragParentId(list: Block[], childId: string): string | null {
  for (const b of list) {
    if (b.children?.some((col) => col.some((c) => c.id === childId))) return b.id;
  }
  return null;
}

function BlockRow({
  block, selectedId, canEdit, onSelect, onDelete, onDuplicate, onToggleHidden, dragRef, onDrop, col = null,
}: {
  block: Block;
  selectedId: string | null;
  canEdit: boolean;
  onSelect: (id: string, col?: number | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden?: (id: string) => void;
  dragRef: React.MutableRefObject<{ id: string; col: number | null } | null>;
  onDrop: (targetId: string, col: number | null) => void;
  col?: number | null;
}) {
  const lib = BLOCK_LIBRARY.find((b) => b.type === block.type);
  const selected = selectedId === block.id;
  return (
    <div
      draggable={canEdit}
      onDragStart={() => canEdit && (dragRef.current = { id: block.id, col })}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (canEdit) onDrop(block.id, col); }}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id, col); }}
      style={{
        border: "1px solid " + (selected ? "#24457A" : "#E4E1DA"),
        borderLeft: "4px solid " + (selected ? "#24457A" : "#CBD5E1"),
        background: "#fff", borderRadius: 8, padding: "10px 12px", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{lib?.icon ?? "▦"}</span>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{lib?.label ?? block.type}</span>
        <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: MONO, marginLeft: "auto" }}>#{block.id}</span>
      </div>
      {canEdit && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }} style={miniBtn}>Duplicate</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }} style={{ ...miniBtn, color: "#B91C1C", borderColor: "#FCA5A5" }}>Delete</button>
          {onToggleHidden && col === null && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleHidden(block.id); }} style={miniBtn}>{block.style.hidden ? "Show" : "Hide"}</button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8" }}>drag to reorder</span>
        </div>
      )}

      {block.children && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${block.children.length}, 1fr)`, gap: 8, marginTop: 10 }}>
          {block.children.map((column, ci) => (
            <div key={ci} onClick={(e) => { e.stopPropagation(); onSelect(block.id, ci); }}
              style={{ border: "1px dashed #CBD5E1", borderRadius: 6, padding: 8, minHeight: 60, background: "#F8FAFC" }}>
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: MONO, marginBottom: 6 }}>col {ci + 1}</div>
              <div style={{ display: "grid", gap: 6 }}>
                {column.map((c) => (
                  <BlockRow key={c.id} block={c} selectedId={selectedId} canEdit={canEdit} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} dragRef={dragRef} onDrop={onDrop} col={ci} />
                ))}
                {column.length === 0 && <div style={{ fontSize: 11, color: "#94A3B8" }}>select, then add a block</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700 };

// ── visual canvas — renders the real blocks with select / move / free-drag ──
type CanvasCtx = {
  storeSlug: string; products: Product[]; accent: string; currency: string;
  search: string; setSearch: (v: string) => void; addToCart: (p: Product) => void;
};

function VisualCanvas({
  page, ctx, selectedId, canEdit, snap, onSelect, onMove, onDuplicate, onDelete, onReorder, onFree,
}: {
  page: Page;
  ctx: CanvasCtx;
  selectedId: string | null;
  canEdit: boolean;
  snap: number;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onFree: (id: string, x: number, y: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={wrapRef}
      onClick={() => onSelect("")}
      style={{ position: "relative", background: "#fff", border: "1px solid #E4E1DA", borderRadius: 6, overflow: "hidden", minHeight: 400 }}
    >
      {page.blocks.map((b) => (
        <SelectableBlock
          key={b.id}
          block={b}
          ctx={ctx}
          canEdit={canEdit}
          snap={snap}
          selected={selectedId === b.id}
          canvasRef={wrapRef}
          onSelect={onSelect}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onReorder={onReorder}
          onFree={onFree}
        />
      ))}
    </div>
  );
}

function SelectableBlock({
  block, ctx, canEdit, snap, selected, canvasRef, onSelect, onMove, onDuplicate, onDelete, onReorder, onFree,
}: {
  block: Block;
  ctx: CanvasCtx;
  canEdit: boolean;
  snap: number;
  selected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onFree: (id: string, x: number, y: number) => void;
}) {
  const free = !!block.style.free;
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);

  function onHandleDown(e: React.PointerEvent) {
    if (!canEdit || !free) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { ox: block.style.x ?? 0, oy: block.style.y ?? 0, sx: e.clientX, sy: e.clientY };
  }
  function onHandleMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    const nx = Math.max(0, Math.round((drag.current.ox + dx) / snap) * snap);
    const ny = Math.max(0, Math.round((drag.current.oy + dy) / snap) * snap);
    onFree(block.id, nx, ny);
  }
  function onHandleUp(e: React.PointerEvent) {
    drag.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }

  const wrapStyle: React.CSSProperties = free
    ? { position: "absolute", left: block.style.x ?? 0, top: block.style.y ?? 0, width: block.style.w || "auto", zIndex: selected ? 20 : 10 }
    : { position: "relative" };

  return (
    <div
      style={wrapStyle}
      draggable={canEdit && !free}
      onDragStart={(e) => { e.dataTransfer.setData("text/block", block.id); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { if (!free) e.preventDefault(); }}
      onDrop={(e) => {
        const from = e.dataTransfer.getData("text/block");
        if (from && from !== block.id) { e.preventDefault(); e.stopPropagation(); onReorder(from, block.id); }
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
    >
      {/* click shield so inner buttons/links don't fire while editing */}
      {canEdit && <div style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }} />}

      <div style={{ outline: selected ? "2px solid #24457A" : block.style.hidden ? "1px dashed #CBD5E1" : "1px solid transparent", outlineOffset: -1, opacity: block.style.hidden ? 0.45 : 1 }}>
        {/* strip free-positioning here — the SelectableBlock wrapper handles placement */}
        <BlockRenderer blocks={[{ ...block, style: { ...block.style, free: false, x: undefined, y: undefined } }]} ctx={ctx} showHidden />
      </div>

      {canEdit && selected && (
        <div style={{ position: "absolute", top: 4, right: 4, zIndex: 30, display: "flex", gap: 3, background: "#24457A", borderRadius: 6, padding: 3 }}>
          {free && (
            <button type="button" title="Drag to move" onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp}
              style={{ ...canvasBtn, cursor: "grab" }}>✥</button>
          )}
          <button type="button" title="Move up" onClick={(e) => { e.stopPropagation(); onMove(block.id, -1); }} style={canvasBtn}>↑</button>
          <button type="button" title="Move down" onClick={(e) => { e.stopPropagation(); onMove(block.id, 1); }} style={canvasBtn}>↓</button>
          <button type="button" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }} style={canvasBtn}>⧉</button>
          <button type="button" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }} style={{ ...canvasBtn, color: "#FCA5A5" }}>🗑</button>
        </div>
      )}
      {canEdit && selected && (
        <div style={{ position: "absolute", top: 4, left: 4, zIndex: 30, background: "#24457A", color: "#fff", fontSize: 10, fontFamily: MONO, padding: "2px 6px", borderRadius: 5 }}>
          #{block.id}
        </div>
      )}
    </div>
  );
}

const canvasBtn: React.CSSProperties = { border: 0, background: "transparent", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: "2px 6px", lineHeight: 1 };

const MEDIA_FIELDS = new Set(["src", "image", "poster"]);

function Inspector({ block, canStyle, collections, onChange, onPickMedia }: {
  block: Block;
  canStyle: boolean;
  collections: CollectionMeta[];
  onChange: (patch: Partial<Block>) => void;
  onPickMedia?: (setter: (url: string) => void) => void;
}) {
  const lib = BLOCK_LIBRARY.find((b) => b.type === block.type);
  const s = block.style;
  const field = (label: string, node: React.ReactNode) => (
    <label style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>
      {label}
      {node}
    </label>
  );
  const inp: React.CSSProperties = { border: "1px solid #E4E1DA", borderRadius: 6, padding: "7px 9px", fontSize: 12, width: "100%" };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{lib?.label ?? block.type}</div>
        <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: MONO }}>id #{block.id}</div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {(lib?.fields ?? []).map((f) => {
          const val = block.props[f.key];
          if (block.type === "collection" && f.key === "collectionKey") {
            return field("Collection", (
              <select value={String(val ?? "")} onChange={(e) => onChange({ props: { collectionKey: e.target.value } })} style={inp}>
                <option value="">— pick a collection —</option>
                {collections.map((c) => <option key={c.id} value={c.key}>{c.name} ({c.key})</option>)}
              </select>
            ));
          }
          if (onPickMedia && MEDIA_FIELDS.has(f.key) && f.kind === "text") {
            return field(f.label, (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={String(val ?? "")} onChange={(e) => onChange({ props: { [f.key]: e.target.value } })} style={{ ...inp, flex: 1 }} placeholder="paste URL or upload →" />
                <button type="button" onClick={() => onPickMedia((url) => onChange({ props: { [f.key]: url } }))} style={miniBtn}>📁</button>
              </div>
            ));
          }
          if (f.kind === "toggle") {
            return field(f.label, (
              <input type="checkbox" checked={val !== false} onChange={(e) => onChange({ props: { [f.key]: e.target.checked } })} />
            ));
          }
          if (f.kind === "select") {
            return field(f.label, (
              <select value={String(val ?? f.options?.[0] ?? "")} onChange={(e) => onChange({ props: { [f.key]: e.target.value } })} style={inp}>
                {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ));
          }
          if (f.kind === "textarea") {
            return field(f.label, (
              <textarea rows={3} value={String(val ?? "")} onChange={(e) => onChange({ props: { [f.key]: e.target.value } })} style={{ ...inp, resize: "vertical" }} />
            ));
          }
          if (f.kind === "number") {
            return field(f.label, (
              <input type="number" value={Number(val ?? 0)} onChange={(e) => onChange({ props: { [f.key]: Number(e.target.value) } })} style={inp} />
            ));
          }
          if (f.kind === "color") {
            return field(f.label, (
              <input type="color" value={String(val ?? "#000000")} onChange={(e) => onChange({ props: { [f.key]: e.target.value } })} />
            ));
          }
          return field(f.label, (
            <input value={String(val ?? "")} onChange={(e) => onChange({ props: { [f.key]: e.target.value } })} style={inp} />
          ));
        })}
      </div>

      {!canStyle ? (
        <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 12, fontSize: 11, color: "#B45309", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: 10 }}>
          Colour, spacing &amp; alignment controls unlock on <strong>Pro Showroom</strong>.
        </div>
      ) : (
      <>
      <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 12, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>Colour</div>
        {field("Background", (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="color" value={s.bg || "#ffffff"} onChange={(e) => onChange({ style: { bg: e.target.value } })} />
            <button type="button" onClick={() => onChange({ style: { bg: undefined } })} style={miniBtn}>clear</button>
          </div>
        ))}
        <Swatches onPick={(c) => onChange({ style: { bg: c } })} />
        {field("Text colour", (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="color" value={s.color || "#0f172a"} onChange={(e) => onChange({ style: { color: e.target.value } })} />
            <button type="button" onClick={() => onChange({ style: { color: undefined } })} style={miniBtn}>clear</button>
          </div>
        ))}
        <Swatches onPick={(c) => onChange({ style: { color: c } })} />
        {field("Background image", (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={s.bgImage ?? ""} onChange={(e) => onChange({ style: { bgImage: e.target.value || undefined } })} style={{ ...inp, flex: 1 }} placeholder="none" />
            {onPickMedia && <button type="button" onClick={() => onPickMedia((url) => onChange({ style: { bgImage: url } }))} style={miniBtn}>📁</button>}
            {s.bgImage && <button type="button" onClick={() => onChange({ style: { bgImage: undefined } })} style={miniBtn}>clear</button>}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 12, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>Typography &amp; spacing</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {field("Font size (px)", <input type="number" value={s.fontSize ?? ""} placeholder="auto" onChange={(e) => onChange({ style: { fontSize: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
          {field("Font weight", (
            <select value={s.fontWeight ?? ""} onChange={(e) => onChange({ style: { fontWeight: e.target.value ? Number(e.target.value) : undefined } })} style={inp}>
              <option value="">auto</option>{[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ))}
          {field("Letter spacing", <input type="number" value={s.letterSpacing ?? ""} placeholder="0" onChange={(e) => onChange({ style: { letterSpacing: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
          {field("Line height", <input type="number" step="0.1" value={s.lineHeight ?? ""} placeholder="auto" onChange={(e) => onChange({ style: { lineHeight: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
          {field("Vertical padding", <input type="number" value={s.padY ?? 40} onChange={(e) => onChange({ style: { padY: Number(e.target.value) } })} style={inp} />)}
          {field("Max width (px)", <input type="number" value={s.maxWidth ?? 1120} onChange={(e) => onChange({ style: { maxWidth: Number(e.target.value) } })} style={inp} />)}
          {field("Margin top", <input type="number" value={s.mt ?? ""} placeholder="0" onChange={(e) => onChange({ style: { mt: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
          {field("Margin bottom", <input type="number" value={s.mb ?? ""} placeholder="0" onChange={(e) => onChange({ style: { mb: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
        </div>
        {field("Align", (
          <select value={s.align ?? "left"} onChange={(e) => onChange({ style: { align: e.target.value as "left" | "center" | "right" } })} style={inp}>
            <option value="left">left</option><option value="center">center</option><option value="right">right</option>
          </select>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 12, display: "grid", gap: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>Shape</div>
        <div style={{ display: "flex", gap: 6 }}>
          {SHAPE_PRESETS.map((sp) => (
            <button key={sp.label} type="button" onClick={() => onChange({ style: { radius: sp.radius } })}
              style={{ ...miniBtn, flex: 1, background: (s.radius ?? -1) === sp.radius ? "#EEF2F8" : "#fff", borderColor: (s.radius ?? -1) === sp.radius ? "#24457A" : "#E4E1DA" }}>
              {sp.label}
            </button>
          ))}
        </div>
        {field("Corner radius (px)", <input type="number" value={s.radius ?? ""} placeholder="0" onChange={(e) => onChange({ style: { radius: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
      </div>

      <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 12, display: "grid", gap: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>Position</div>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, fontWeight: 700, color: "#475569" }}>
          <input type="checkbox" checked={!!s.free} onChange={(e) => onChange({ style: { free: e.target.checked } })} />
          Free-drag position (absolute)
        </label>
        {s.free && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {field("X", <input type="number" value={s.x ?? 0} onChange={(e) => onChange({ style: { x: Number(e.target.value) } })} style={inp} />)}
              {field("Y", <input type="number" value={s.y ?? 0} onChange={(e) => onChange({ style: { y: Number(e.target.value) } })} style={inp} />)}
              {field("Width", <input type="number" value={s.w ?? ""} placeholder="auto" onChange={(e) => onChange({ style: { w: e.target.value ? Number(e.target.value) : undefined } })} style={inp} />)}
            </div>
            <button type="button" onClick={() => onChange({ style: { free: false, x: undefined, y: undefined, w: undefined } })} style={miniBtn}>Reset free-drag position</button>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function Swatches({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
      {THEME_SWATCHES.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} title={c}
          style={{ width: "100%", aspectRatio: "1", borderRadius: 4, border: "1px solid #E4E1DA", background: c, cursor: "pointer" }} />
      ))}
    </div>
  );
}

// ── media library — Supabase Storage, per-tenant ──────────────────────
type MediaItem = { id: string; path: string; url: string; kind: "image" | "video" | "file"; mime: string | null; bytes: number | null; alt: string | null; created_at: string };

function MediaLibrary({ picking, onPick, onClose }: { picking: boolean; onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/media");
      const d = await r.json();
      setItems(Array.isArray(d.media) ? d.media : []);
    } catch { setErr("Could not load media."); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/media", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Upload failed."); break; }
      setItems((prev) => [d.media, ...prev]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(id: string) {
    await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 500, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "min(760px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Media library</h3>
          <button type="button" onClick={onClose} style={{ border: 0, background: "none", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
          Images &amp; video are stored privately in your Supabase project — scoped to this company, no other tenant can list or change them. Up to 50&nbsp;MB per file.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" multiple onChange={(e) => upload(e.target.files)} style={{ fontSize: 12 }} />
          {busy && <span style={{ fontSize: 12, color: "#64748B" }}>Uploading…</span>}
        </div>
        {err && <div style={{ marginTop: 10, color: "#B91C1C", fontSize: 12 }}>{err}</div>}

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8" }}>Nothing uploaded yet.</div>
          ) : (
            items.map((m) => (
              <div key={m.id} style={{ border: "1px solid #E4E1DA", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <div style={{ aspectRatio: "1", background: "#F8FAFC", display: "grid", placeItems: "center" }}>
                  {m.kind === "image" ? (
                    <img src={m.url} alt={m.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : m.kind === "video" ? (
                    <span style={{ fontSize: 28 }}>▶</span>
                  ) : (
                    <span style={{ fontSize: 28 }}>📄</span>
                  )}
                </div>
                <div style={{ padding: 6, display: "grid", gap: 4 }}>
                  {picking && (
                    <button type="button" onClick={() => onPick(m.url)} style={{ ...miniBtn, background: "#24457A", color: "#fff", borderColor: "#24457A" }}>Use</button>
                  )}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(m.url)} style={miniBtn}>Copy URL</button>
                  <button type="button" onClick={() => remove(m.id)} style={{ ...miniBtn, color: "#B91C1C", borderColor: "#FCA5A5" }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── collections manager (the "database") ───────────────────────────────
function CollectionsManager({
  collections, onClose, onChanged,
}: {
  collections: CollectionMeta[];
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const blank = { key: "", name: "", fields: [{ key: "name", label: "Name", type: "text" as FieldType }] };
  const [draft, setDraft] = useState<{ key: string; name: string; fields: { key: string; label: string; type: FieldType }[] }>(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const inp: React.CSSProperties = { border: "1px solid #E4E1DA", borderRadius: 6, padding: "7px 9px", fontSize: 12, width: "100%" };

  function setName(name: string) {
    setDraft((d) => ({ ...d, name, key: d.key || name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") }));
  }
  function addField() {
    setDraft((d) => ({ ...d, fields: [...d.fields, { key: `field${d.fields.length + 1}`, label: "", type: "text" }] }));
  }
  function setField(i: number, patch: Partial<{ key: string; label: string; type: FieldType }>) {
    setDraft((d) => ({ ...d, fields: d.fields.map((f, x) => (x === i ? { ...f, ...patch } : f)) }));
  }
  function delField(i: number) {
    setDraft((d) => ({ ...d, fields: d.fields.filter((_, x) => x !== i) }));
  }

  async function save() {
    setBusy(true);
    setErr("");
    const fields = draft.fields
      .map((f) => ({ ...f, key: (f.key || f.label).trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_") }))
      .filter((f) => f.key && f.label);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: draft.key, name: draft.name, fields }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Could not save."); return; }
    setDraft(blank);
    await onChanged();
  }

  async function remove(id: string) {
    await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
    await onChanged();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 400, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "min(640px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Data collections</h3>
          <button type="button" onClick={onClose} style={{ border: 0, background: "none", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
          Each collection is a table in your Supabase database. Add a <em>Data collection</em> block to a page to show its rows or collect new ones from visitors.
        </p>

        {collections.length > 0 && (
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {collections.map((c) => (
              <div key={c.id} style={{ border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{c.name} <span style={{ fontFamily: MONO, color: "#94A3B8", fontSize: 11 }}>{c.key}</span></div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{c.fields.map((f) => f.label).join(" · ") || "no fields"} — {c.recordCount ?? 0} rows</div>
                </div>
                <button type="button" onClick={() => remove(c.id)} style={{ ...miniBtn, color: "#B91C1C", borderColor: "#FCA5A5" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, borderTop: "1px solid #E4E1DA", paddingTop: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748B", fontFamily: MONO }}>New collection</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>Name
              <input value={draft.name} onChange={(e) => setName(e.target.value)} placeholder="Enquiries" style={inp} />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>Key
              <input value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") }))} placeholder="enquiries" style={{ ...inp, fontFamily: MONO }} />
            </label>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: "#475569" }}>Fields</div>
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            {draft.fields.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                <input value={f.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Label" style={inp} />
                <select value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldType })} style={inp}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => delField(i)} style={{ ...miniBtn, color: "#B91C1C", borderColor: "#FCA5A5" }}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addField} style={{ ...miniBtn, marginTop: 8 }}>+ Add field</button>

          {err && <div style={{ marginTop: 10, color: "#B91C1C", fontSize: 12 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, border: "1px solid #E4E1DA", background: "#fff", padding: "10px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>Close</button>
            <button type="button" onClick={save} disabled={busy || !draft.name || !draft.key} style={{ flex: 1, border: 0, background: "#24457A", color: "#fff", padding: "10px 12px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
              {busy ? "Saving…" : "Create collection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
