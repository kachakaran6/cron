import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  Globe,
  AlertTriangle,
  Clock,
  Activity,
  X,
} from 'lucide-react';
import { CustomSelect } from '../../components/ui/CustomSelect';
import {
  fetchStatusPages,
  createStatusPage,
  updateStatusPage,
  deleteStatusPage,
  fetchJobs,
  StatusPageDTO,
  IncidentItem,
} from '../../services/api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function MonitorsListPage() {
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modals state
  const [editingPage, setEditingPage] = useState<StatusPageDTO | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for Create/Edit Status Page
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [monitoredJobIds, setMonitoredJobIds] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);

  // Incident sub-form state
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentStatus, setIncidentStatus] = useState<'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED'>('INVESTIGATING');
  const [incidentMessage, setIncidentMessage] = useState('');

  // Queries
  const { data: statusPages, isLoading, refetch } = useQuery({
    queryKey: ['status-pages'],
    queryFn: fetchStatusPages,
  });

  const { data: availableJobs } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createStatusPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StatusPageDTO> }) => updateStatusPage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] });
      setEditingPage(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStatusPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setIsPublished(true);
    setLogoUrl('');
    setMonitoredJobIds([]);
    setIncidents([]);
    setShowAddIncident(false);
    setIncidentTitle('');
    setIncidentStatus('INVESTIGATING');
    setIncidentMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreating(true);
    setEditingPage(null);
  };

  const openEditModal = (page: StatusPageDTO) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setIsPublished(page.isPublished);
    setLogoUrl(page.logoUrl || '');
    setMonitoredJobIds(page.monitoredJobIds || []);
    setIncidents(page.incidents || []);
    setIsCreating(false);
  };

  const handleCopyLink = (pageSlug: string) => {
    const fullUrl = `${window.location.origin}/status/${pageSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(pageSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isCreating) {
      createMutation.mutate({
        title: title.trim(),
        slug: slug.trim() || undefined,
        isPublished,
        logoUrl: logoUrl.trim() || undefined,
        monitoredJobIds,
        incidents,
      });
    } else if (editingPage) {
      updateMutation.mutate({
        id: editingPage.id,
        data: {
          title: title.trim(),
          slug: slug.trim() || editingPage.slug,
          isPublished,
          logoUrl: logoUrl.trim() || undefined,
          monitoredJobIds,
          incidents,
        },
      });
    }
  };

  const handleAddIncident = () => {
    if (!incidentTitle.trim()) return;
    const newInc: IncidentItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: incidentTitle.trim(),
      status: incidentStatus,
      startDate: new Date().toISOString(),
      message: incidentMessage.trim() || undefined,
    };
    setIncidents([newInc, ...incidents]);
    setIncidentTitle('');
    setIncidentMessage('');
    setShowAddIncident(false);
  };

  const handleDeleteIncident = (incId: string) => {
    setIncidents(incidents.filter((i) => i.id !== incId));
  };

  const toggleJobMonitor = (jobId: string) => {
    if (monitoredJobIds.includes(jobId)) {
      setMonitoredJobIds(monitoredJobIds.filter((id) => id !== jobId));
    } else {
      if (monitoredJobIds.length >= 10) {
        alert('Status monitor quota reached: 10 / 10 maximum monitors per page.');
        return;
      }
      setMonitoredJobIds([...monitoredJobIds, jobId]);
    }
  };

  const pagesCount = statusPages?.length || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Monitoring</span>
            <span>/</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Status Pages</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
            Status Pages &amp; Monitors
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Create branded public or private status dashboards for your scheduled jobs and APIs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md btn-accent shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Status Page</span>
        </button>
      </div>

      {/* Quota Banner */}
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] font-semibold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Status Pages Quota: <span className="font-mono">{pagesCount} / 2</span> used
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Each status page includes up to 10 linked monitors and public SSL domains.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium self-start sm:self-auto">
          Active Plan: Pro Tier
        </span>
      </div>

      {/* Status Pages List */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Public Domain</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Monitors</th>
                <th className="px-4 py-3">Incidents</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans text-zinc-700 dark:text-zinc-300">
              {isLoading && <TableSkeleton rows={3} cols={6} />}

              {!isLoading && pagesCount === 0 && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No status pages created yet"
                      description="Create your first status page to display live uptime, recent execution metrics, and incidents for your cron jobs."
                      action={{
                        label: 'Create Status Page',
                        onClick: openCreateModal,
                      }}
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                statusPages?.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      <button
                        onClick={() => openEditModal(page)}
                        className="hover:underline text-left font-medium"
                      >
                        {page.title}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{page.slug}.cron.samast.pro</span>
                        <button
                          onClick={() => handleCopyLink(page.slug)}
                          title="Copy status page link"
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                        >
                          {copiedSlug === page.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          page.isPublished
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                      Quota: {page.monitorCount || 0} / 10
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                      {page.activeIncidentsCount && page.activeIncidentsCount > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          {page.activeIncidentsCount} active
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">0 active</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/status/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View live public status page"
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => openEditModal(page)}
                          title="Edit status page"
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete status page "${page.title}"?`)) {
                              deleteMutation.mutate(page.id);
                            }
                          }}
                          title="Delete status page"
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Page Editor Modal (Create / Edit) */}
      {(isCreating || editingPage) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {editingPage ? `Edit Status Page: ${editingPage.title}` : 'Create New Status Page'}
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {editingPage ? editingPage.title : 'Configure Status Page'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPage(null);
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-6">
              {/* 1. Common Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">Common</h3>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Services Status"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. acme-status"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Logo Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="font-semibold">Publish status page (accessible to anyone)</span>
                  </label>
                </div>
              </div>

              {/* 2. Domains Section */}
              <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">Domains</span>
                  <span className="font-mono text-zinc-500">Quota: 1 / 2</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span>{slug || 'p2dxmk62'}.status.cron.samast.pro</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">SSL Active</span>
                </div>
              </div>

              {/* 3. Incidents Section */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">Incidents</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddIncident(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Incident</span>
                  </button>
                </div>

                {/* Sub-form for Adding Incident */}
                {showAddIncident && (
                  <div className="p-3.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 space-y-3">
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">New Incident Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Incident Title (e.g. High API Latency)"
                        value={incidentTitle}
                        onChange={(e) => setIncidentTitle(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-xs"
                      />
                      <div className="min-w-[160px]">
                        <CustomSelect
                          value={incidentStatus}
                          onChange={(val) => setIncidentStatus(val as any)}
                          options={[
                            { value: 'INVESTIGATING', label: 'INVESTIGATING', badge: 'ALERT' },
                            { value: 'IDENTIFIED', label: 'IDENTIFIED', badge: 'INFO' },
                            { value: 'MONITORING', label: 'MONITORING', badge: 'WATCH' },
                            { value: 'RESOLVED', label: 'RESOLVED', badge: 'OK' },
                          ]}
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Details / update message..."
                      value={incidentMessage}
                      onChange={(e) => setIncidentMessage(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddIncident(false)}
                        className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddIncident}
                        className="px-3 py-1 bg-[var(--accent)] text-white font-semibold text-xs rounded shadow-xs"
                      >
                        Save Incident
                      </button>
                    </div>
                  </div>
                )}

                {incidents.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                    This status page does not have incidents yet. Get started by clicking &quot;Add Incident&quot;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{inc.title}</div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                            <span className="font-mono">{inc.status}</span>
                            <span>•</span>
                            <span>{new Date(inc.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteIncident(inc.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Status Monitors Section */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                    Status Monitors
                  </h3>
                  <span className="font-mono text-xs text-zinc-500">
                    Quota: {monitoredJobIds.length} / 10
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select the scheduled jobs to display on this status page:
                </p>

                {availableJobs && availableJobs.length > 0 ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {availableJobs.map((job) => {
                      const isSelected = monitoredJobIds.includes(job.id);
                      return (
                        <div
                          key={job.id}
                          onClick={() => toggleJobMonitor(job.id)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] text-zinc-900 dark:text-zinc-100'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{job.name}</div>
                            <div className="text-[11px] font-mono opacity-70 truncate max-w-xs">{job.url}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[var(--accent)] pointer-events-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No scheduled jobs created yet.</p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPage(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 btn-accent font-semibold text-xs rounded-md shadow-sm transition-all disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save status page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
