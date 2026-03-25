import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

function toEmbeddableVideoUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }

    if (host.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return value;
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
      if (url.pathname.startsWith('/live/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://player.vimeo.com/video/${id}` : value;
    }
  } catch {
    return value;
  }

  return value;
}

function emptyModuleDraft(index = 0) {
  return {
    id: `module-${Date.now()}-${index}`,
    type: 'chapter',
    title: `Module ${index + 1}`,
    body: '',
    videoUrl: '',
    resourceLabel: '',
    resourceUrl: '',
    checklistText: '',
  };
}

function emptyEssentialDraft(item = null) {
  return {
    id: item?.id || '',
    slug: item?.slug || `staff-essential-${Date.now()}`,
    section: item?.section || 'Getting Started',
    title: item?.title || '',
    summary: item?.summary || '',
    coverVideoUrl: item?.coverVideoUrl || '',
    tagsText: Array.isArray(item?.tags) ? item.tags.join(', ') : '',
    sortOrder: String(item?.sortOrder ?? 0),
    isActive: item?.isActive !== false,
    modules: Array.isArray(item?.modules) && item.modules.length
      ? item.modules.map((module, index) => ({
          id: module.id || `module-${Date.now()}-${index}`,
          type: module.type || 'chapter',
          title: module.title || `Module ${index + 1}`,
          body: module.body || '',
          videoUrl: module.videoUrl || '',
          resourceLabel: module.resourceLabel || '',
          resourceUrl: module.resourceUrl || '',
          checklistText: Array.isArray(module.checklist) ? module.checklist.join('\n') : '',
        }))
      : [emptyModuleDraft(0)],
  };
}

function moduleTypeClass(type) {
  if (type === 'video') return 'border-red-400/35 bg-red-500/12 text-red-100';
  if (type === 'guide') return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100';
  if (type === 'instruction') return 'border-amber-400/35 bg-amber-500/12 text-amber-100';
  return 'border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100';
}

function humanDate(value) {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return date.toLocaleString();
}

export default function StaffEssentialsHub({
  essentials,
  selectedEssentialSlug,
  setSelectedEssentialSlug,
  canManageEssentials,
  tableAvailable = true,
  onRefresh,
  onSaveEssential,
  onDeleteEssential,
}) {
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(emptyEssentialDraft());

  const visibleEssentials = useMemo(() => {
    const base = canManageEssentials ? essentials : essentials.filter(item => item.isActive !== false);
    const query = search.trim().toLowerCase();
    return base.filter((item) => {
      if (sectionFilter !== 'All' && item.section !== sectionFilter) return false;
      if (!query) return true;
      const haystack = [
        item.section,
        item.title,
        item.summary,
        ...(item.tags || []),
        ...(item.modules || []).flatMap(module => [module.title, module.body]),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [canManageEssentials, essentials, search, sectionFilter]);

  const sections = useMemo(() => ['All', ...new Set((essentials || []).map(item => item.section).filter(Boolean))], [essentials]);
  const selected = visibleEssentials.find(item => item.slug === selectedEssentialSlug)
    || essentials.find(item => item.slug === selectedEssentialSlug)
    || visibleEssentials[0]
    || essentials[0]
    || null;

  useEffect(() => {
    if (!selected && selectedEssentialSlug) setSelectedEssentialSlug('');
    if (!selectedEssentialSlug && selected?.slug) setSelectedEssentialSlug(selected.slug);
  }, [selected, selectedEssentialSlug, setSelectedEssentialSlug]);

  function openCreate() {
    setDraft(emptyEssentialDraft());
    setEditorOpen(true);
  }

  function openEdit(item) {
    setDraft(emptyEssentialDraft(item));
    setEditorOpen(true);
  }

  function updateModule(index, patch) {
    setDraft(prev => ({
      ...prev,
      modules: prev.modules.map((module, moduleIndex) => (moduleIndex === index ? { ...module, ...patch } : module)),
    }));
  }

  function addModule() {
    setDraft(prev => ({
      ...prev,
      modules: [...prev.modules, emptyModuleDraft(prev.modules.length)],
    }));
  }

  function removeModule(index) {
    setDraft(prev => {
      const nextModules = prev.modules.filter((_, moduleIndex) => moduleIndex !== index);
      return {
        ...prev,
        modules: nextModules.length ? nextModules : [emptyModuleDraft(0)],
      };
    });
  }

  async function saveEditor() {
    const savedSlug = await onSaveEssential?.(draft);
    if (savedSlug) {
      setSelectedEssentialSlug(savedSlug);
      setEditorOpen(false);
    }
  }

  async function deleteSelected(item) {
    if (!item) return;
    const confirmed = window.confirm(`Delete "${item.title}" from Staff Essentials?`);
    if (!confirmed) return;
    const deleted = await onDeleteEssential?.(item);
    if (deleted) {
      setEditorOpen(false);
      if (selectedEssentialSlug === item.slug) {
        const next = visibleEssentials.find(entry => entry.slug !== item.slug) || essentials.find(entry => entry.slug !== item.slug) || null;
        setSelectedEssentialSlug(next?.slug || '');
      }
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
      <Card className="border-white/10 bg-white/5 xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Staff Essentials</span>
            <Badge className="border-white/10 bg-white/10 text-zinc-200">{visibleEssentials.length} shown</Badge>
          </CardTitle>
          <div className="space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search videos, guides, or chapters..."
              className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
            />
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="border-white/10 bg-black/30 text-white">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRefresh} className="flex-1 min-w-[140px]">Refresh Essentials</Button>
            {canManageEssentials && (
              <Button onClick={openCreate} className="flex-1 min-w-[140px] border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.3))]">
                Create Essential
              </Button>
            )}
          </div>
          {!tableAvailable && (
            <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-100">
              Staff Essentials is not enabled in Supabase yet. Run the latest SQL block first.
            </div>
          )}
          <div className="max-h-[calc(100vh-320px)] space-y-3 overflow-y-auto pr-1">
            {visibleEssentials.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSelectedEssentialSlug(item.slug)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selected?.slug === item.slug ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/10 bg-white/10 text-zinc-200">{item.section}</Badge>
                  {!item.isActive && canManageEssentials && <Badge className="border-red-400/35 bg-red-500/12 text-red-100">Inactive</Badge>}
                  <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{item.modules.length} modules</Badge>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{item.title}</div>
                <div className="mt-2 line-clamp-3 text-sm text-zinc-400">{item.summary || 'No summary yet.'}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{humanDate(item.updatedAt)}</div>
              </button>
            ))}
            {!visibleEssentials.length && (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                {tableAvailable ? 'No essentials found for this filter yet.' : 'Staff Essentials will appear here once the database table exists.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!selected && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6 text-sm text-zinc-400">
              Select a Staff Essential to view videos, instructions, and training material.
            </CardContent>
          </Card>
        )}

        {selected && (
          <>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-white/10 bg-white/10 text-zinc-200">{selected.section}</Badge>
                      <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">{selected.modules.length} modules</Badge>
                      {selected.tags?.slice(0, 4).map(tag => (
                        <Badge key={tag} className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{tag}</Badge>
                      ))}
                    </div>
                    <div className="text-xl font-semibold text-white">{selected.title}</div>
                    <div className="text-sm text-zinc-400">{selected.summary || 'No summary provided yet.'}</div>
                  </div>
                  {canManageEssentials && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openEdit(selected)} className="border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.3))]">
                        Edit Essential
                      </Button>
                      <Button onClick={() => deleteSelected(selected)} variant="secondary" className="border-red-400/35 text-red-100 hover:text-white">
                        Delete Essential
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.coverVideoUrl && (
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
                    <iframe
                      src={toEmbeddableVideoUrl(selected.coverVideoUrl)}
                      title={selected.title}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>Updated {humanDate(selected.updatedAt)}</span>
                  <span>Sort order {selected.sortOrder}</span>
                  {!selected.isActive && <span className="text-red-300">Inactive for staff</span>}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selected.modules.map((module, index) => (
                <Card key={module.id || `${selected.slug}-${index}`} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <Badge className={moduleTypeClass(module.type)}>{module.type}</Badge>
                      <span>{module.title || `Module ${index + 1}`}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!!module.body && (
                      <div className="whitespace-pre-line rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-zinc-200">
                        {module.body}
                      </div>
                    )}
                    {module.videoUrl && (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                          <iframe
                            src={toEmbeddableVideoUrl(module.videoUrl)}
                            title={module.title || selected.title}
                            className="aspect-video w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                        <a href={module.videoUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm text-cyan-200 hover:text-cyan-100">
                          Open clip in new tab
                        </a>
                      </div>
                    )}
                    {!!module.checklist?.length && (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Things to remember</div>
                        <div className="mt-3 space-y-2">
                          {module.checklist.map((item, checklistIndex) => (
                            <div key={`${module.id || index}-check-${checklistIndex}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(module.resourceLabel || module.resourceUrl) && (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-4 text-sm text-cyan-100">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Linked resource</div>
                        <div className="mt-3">
                          {module.resourceUrl ? (
                            <a href={module.resourceUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                              {module.resourceLabel || module.resourceUrl}
                            </a>
                          ) : (
                            module.resourceLabel
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">{draft.id ? 'Edit Staff Essential' : 'Create Staff Essential'}</div>
                <div className="mt-1 text-sm text-zinc-400">Build a fully custom staff-facing training panel with sections, videos, notes, and resource links.</div>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[360px,1fr]">
              <div className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Title</div>
                      <Input value={draft.title} onChange={(event) => setDraft(prev => ({ ...prev, title: event.target.value }))} className="border-white/10 bg-black/30 text-white" placeholder="Staff essentials title" />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Slug</div>
                      <Input value={draft.slug} onChange={(event) => setDraft(prev => ({ ...prev, slug: event.target.value }))} className="border-white/10 bg-black/30 text-white" placeholder="staff-essentials-slug" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Section</div>
                        <Input value={draft.section} onChange={(event) => setDraft(prev => ({ ...prev, section: event.target.value }))} className="border-white/10 bg-black/30 text-white" placeholder="Getting Started" />
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Sort order</div>
                        <Input type="number" value={draft.sortOrder} onChange={(event) => setDraft(prev => ({ ...prev, sortOrder: event.target.value }))} className="border-white/10 bg-black/30 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Summary</div>
                      <Textarea value={draft.summary} onChange={(event) => setDraft(prev => ({ ...prev, summary: event.target.value }))} className="min-h-[120px] border-white/10 bg-black/30 text-white" placeholder="What does this essentials panel teach staff?" />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Cover video URL</div>
                      <Input value={draft.coverVideoUrl} onChange={(event) => setDraft(prev => ({ ...prev, coverVideoUrl: event.target.value }))} className="border-white/10 bg-black/30 text-white" placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Tags</div>
                      <Input value={draft.tagsText} onChange={(event) => setDraft(prev => ({ ...prev, tagsText: event.target.value }))} className="border-white/10 bg-black/30 text-white" placeholder="Reports, moderation, evidence, conflict" />
                    </div>
                    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-zinc-200">
                      Visible to staff
                      <input id="staff-essential-visible" name="staff_essential_visible" type="checkbox" checked={draft.isActive} onChange={(event) => setDraft(prev => ({ ...prev, isActive: event.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-black/30" />
                    </label>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Modules</div>
                    <div className="text-sm text-zinc-400">Stack chapters, video explainers, guides, and action-focused instruction blocks.</div>
                  </div>
                  <Button onClick={addModule} className="border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.3))]">
                    Add Module
                  </Button>
                </div>

                {(draft.modules || []).map((module, index) => (
                  <Card key={module.id || `draft-module-${index}`} className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={moduleTypeClass(module.type)}>{module.type}</Badge>
                          <span>{module.title || `Module ${index + 1}`}</span>
                        </div>
                        <Button onClick={() => removeModule(index)} variant="secondary" className="border-red-400/35 text-red-100 hover:text-white" disabled={(draft.modules || []).length <= 1}>
                          Remove
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Type</div>
                          <Select value={module.type} onValueChange={(value) => updateModule(index, { type: value })}>
                            <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chapter">Chapter</SelectItem>
                              <SelectItem value="guide">Guide</SelectItem>
                              <SelectItem value="instruction">Instruction</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Module title</div>
                          <Input value={module.title} onChange={(event) => updateModule(index, { title: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="Evidence review basics" />
                        </div>
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Body</div>
                          <Textarea value={module.body} onChange={(event) => updateModule(index, { body: event.target.value })} className="min-h-[150px] border-white/10 bg-black/30 text-white" placeholder="Write the chapter text, guidance, or process here." />
                        </div>
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Checklist points</div>
                          <Textarea value={module.checklistText} onChange={(event) => updateModule(index, { checklistText: event.target.value })} className="min-h-[120px] border-white/10 bg-black/30 text-white" placeholder="One reminder per line" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Video URL</div>
                          <Input value={module.videoUrl} onChange={(event) => updateModule(index, { videoUrl: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Resource label</div>
                            <Input value={module.resourceLabel} onChange={(event) => updateModule(index, { resourceLabel: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="Evidence checklist" />
                          </div>
                          <div>
                            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Resource URL</div>
                            <Input value={module.resourceUrl} onChange={(event) => updateModule(index, { resourceUrl: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="https://..." />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                          Use each module as a building block. A single Staff Essential can mix:
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">chapters</Badge>
                            <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">guides</Badge>
                            <Badge className="border-amber-400/35 bg-amber-500/12 text-amber-100">instructions</Badge>
                            <Badge className="border-red-400/35 bg-red-500/12 text-red-100">videos</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
                  {draft.id && (
                    <Button onClick={() => deleteSelected(draft)} variant="secondary" className="border-red-400/35 text-red-100 hover:text-white">
                      Delete Essential
                    </Button>
                  )}
                  <Button onClick={() => setEditorOpen(false)} variant="secondary">
                    Cancel
                  </Button>
                  <Button onClick={saveEditor}>
                    Save Staff Essential
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
