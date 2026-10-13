import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, Users, Video, Link2, Calendar,
  Clock, User, X, ChevronDown, ChevronUp, ExternalLink, Loader2,
  CheckCircle2, XCircle, HelpCircle
} from 'lucide-react';
import { BACKEND_URL } from '../../../config';

const EMPTY_FORM = {
  title: '',
  conductor: '',
  date: '',
  time: '',
  meetingLink: '',
  participants: [],
  sessionType: 'knowledge-sharing',
};

function formatTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function AdminKnowledgeSessionView({ employees = [], adminName = 'Admin' }) {
  const [activeTab, setActiveTab] = useState('knowledge-sharing');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState(null);

  const activeEmployees = employees.filter((e) => e.status === 'active');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/admin/knowledge-sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setParticipantSearch('');
    setShowModal(true);
  };

  const openEdit = (session) => {
    setEditingId(session._id);
    setForm({
      title: session.title || '',
      conductor: session.conductor || '',
      date: session.date || '',
      time: session.time || '',
      meetingLink: session.meetingLink || '',
      participants: session.participants || [],
      sessionType: sessionType || 'knowledge-sharing',
    });
    setFormError('');
    setParticipantSearch('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Session topic is required.'); return; }
    if (!form.conductor.trim()) { setFormError('Conductor name is required.'); return; }
    if (!form.date) { setFormError('Session date is required.'); return; }
    if (!form.time) { setFormError('Session time is required.'); return; }

    setSubmitting(true);
    try {
      const url = editingId
        ? `${BACKEND_URL}/admin/knowledge-sessions/${editingId}`
        : `${BACKEND_URL}/admin/knowledge-sessions`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdBy: adminName }),
      });
      if (res.ok) {
        alert(editingId ? 'Knowledge session updated successfully.' : 'Knowledge session created successfully.');
        setShowModal(false);
        fetchSessions();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to save session.');
      }
    } catch (err) {
      setFormError('Server error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Knowledge Sharing Session?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/knowledge-sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Session deleted successfully.');
        fetchSessions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete session.');
      }
    } catch (err) {
      alert('Error deleting session.');
    }
  };

  const toggleParticipant = (empId) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.includes(empId)
        ? prev.participants.filter((id) => id !== empId)
        : [...prev.participants, empId],
    }));
  };

  const filteredSessions = sessions.filter((s) => {
    const sType = s.sessionType || 'knowledge-sharing';
    return sType === activeTab &&
      (!searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.conductor.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredEmployees = activeEmployees.filter((e) =>
    !participantSearch ||
    e.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    e.department?.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const getParticipantNames = (participantIds) => {
    return participantIds.map((id) => {
      const emp = activeEmployees.find((e) => e.id === id || e.legacyId === id);
      return emp ? emp.name : id;
    });
  };

  const getParticipantsWithStatus = (session) => {
    const responses = session.responses || [];
    return (session.participants || []).map((id) => {
      const emp = activeEmployees.find((e) => e.id === id || e.legacyId === id);
      const response = responses.find((r) => r.employeeId === id);
      return { id, name: emp ? emp.name : id, status: response ? response.status : 'pending' };
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            Learning & Development Programs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Schedule and manage knowledge-sharing and mentor sessions for your team
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-px relative z-10">
        <button
          onClick={() => setActiveTab('knowledge-sharing')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'knowledge-sharing'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" /> Knowledge Sharing Sessions
          </div>
          {activeTab === 'knowledge-sharing' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full shadow-[0_-2px_8px_rgba(6,182,212,0.5)]"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mentor-session')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'mentor-session'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Mentor Sessions
          </div>
          {activeTab === 'mentor-session' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.5)]"></div>
          )}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Sessions', value: filteredSessions.length, icon: Video, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-200 dark:border-cyan-800' },
          { label: 'Upcoming', value: filteredSessions.filter(s => s.date >= todayStr).length, icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
          { label: 'Past Sessions', value: filteredSessions.filter(s => s.date < todayStr).length, icon: Clock, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
          { label: 'Total Participants', value: filteredSessions.reduce((sum, s) => sum + (s.participants?.length || 0), 0), icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className={`absolute -right-4 -top-4 w-16 h-16 ${stat.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out`} />
              <div className={`w-11 h-11 ${stat.bg} border ${stat.border} rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 relative z-10`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="relative z-10">
                <div className="text-slate-800 dark:text-slate-100 font-black text-2xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</div>
                <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 p-4 shadow-lg shadow-slate-200/40 dark:shadow-none flex gap-4 items-center relative z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by topic or conductor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800/50 transition-all placeholder:text-slate-400"
          />
        </div>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl text-center">
            <div className="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/30 rounded-3xl flex items-center justify-center mb-4 text-4xl shadow-inner">🎥</div>
            <h3 className="text-slate-700 dark:text-slate-200 font-black text-lg mb-2">No Sessions Yet</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xs">
              {searchQuery ? 'No sessions match your search.' : 'Create your first Knowledge Sharing Session to get started.'}
            </p>
            {!searchQuery && (
              <button onClick={openAdd} className="mt-6 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> New Session
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isExpanded = expandedSession === session._id;
            const isPast = session.date < todayStr;
            const participantNames = getParticipantNames(session.participants || []);

            return (
              <div key={session._id} className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-2xl ${isPast ? 'opacity-70' : ''}`}>
                {/* Session Header */}
                <div className="p-6 flex items-start gap-4 flex-wrap">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0 ${isPast ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40'}`}>
                    🎥
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg tracking-tight truncate">{session.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            <User className="w-3.5 h-3.5" /> {session.conductor}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            <Calendar className="w-3.5 h-3.5" /> {session.date}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> {formatTime12(session.time)}
                          </span>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${isPast ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'}`}>
                            <Users className="w-3 h-3" /> {session.participants?.length || 0} participant{session.participants?.length !== 1 ? 's' : ''}
                          </span>
                          {isPast && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Past</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Teams Meeting"
                            className="w-8 h-8 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEdit(session)}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(session._id)}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-500 text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meeting Link preview */}
                    {session.meetingLink && (
                      <div className="mt-2 flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400 font-medium truncate max-w-xs">{session.meetingLink}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Participants */}
                {isExpanded && (() => {
                  const participantsWithStatus = getParticipantsWithStatus(session);
                  const acceptedCount = participantsWithStatus.filter((p) => p.status === 'accepted').length;
                  const rejectedCount = participantsWithStatus.filter((p) => p.status === 'rejected').length;
                  const pendingCount = participantsWithStatus.filter((p) => p.status === 'pending').length;
                  const statusStyles = {
                    accepted: { chip: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', avatar: 'bg-emerald-200 dark:bg-emerald-800', Icon: CheckCircle2 },
                    rejected: { chip: 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800', avatar: 'bg-rose-200 dark:bg-rose-800', Icon: XCircle },
                    pending: { chip: 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700', avatar: 'bg-slate-200 dark:bg-slate-700', Icon: HelpCircle },
                  };
                  return (
                  <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Participants ({session.participants?.length || 0})
                    </div>
                    {participantsWithStatus.length === 0 ? (
                      <p className="text-slate-400 text-sm font-medium italic">No participants assigned yet.</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {acceptedCount} Accepted
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" /> {rejectedCount} Rejected
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <HelpCircle className="w-3.5 h-3.5" /> {pendingCount} Pending
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {participantsWithStatus.map(({ id, name, status }) => {
                            const { chip, avatar, Icon } = statusStyles[status];
                            return (
                              <span key={id} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold ${chip}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${avatar}`}>
                                  {name.charAt(0).toUpperCase()}
                                </span>
                                {name}
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                    🎥
                  </div>
                  <div>
                    <h2 className="text-slate-800 dark:text-slate-100 font-black text-lg tracking-tight">
                      {editingId ? 'Edit Session' : 'New Program Session'}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Schedule a Teams meeting</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
                    {formError}
                  </div>
                )}

                {/* Session Type */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Session Type *
                  </label>
                  <select
                    value={form.sessionType}
                    onChange={(e) => setForm((p) => ({ ...p, sessionType: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all"
                    required
                  >
                    <option value="knowledge-sharing">Knowledge Sharing Session</option>
                    <option value="mentor-session">Mentor Session</option>
                  </select>
                </div>

                {/* Session Topic */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Session Topic / Heading *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Introduction to React Hooks"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all"
                    required
                  />
                </div>

                {/* Conductor */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Conductor (Who is hosting) *
                  </label>
                  <input
                    type="text"
                    value={form.conductor}
                    onChange={(e) => setForm((p) => ({ ...p, conductor: e.target.value }))}
                    placeholder="e.g. John Smith"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all"
                    required
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-bold transition-all cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-bold transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Microsoft Teams Meeting Link
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="url"
                      value={form.meetingLink}
                      onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))}
                      placeholder="https://teams.microsoft.com/..."
                      className="w-full pl-11 pr-4 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Participant Selector */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Participants — {form.participants.length} selected
                  </label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                    {/* Search inside participants */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    {/* Quick actions */}
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, participants: activeEmployees.map((e) => e.id) }))}
                        className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, participants: [] }))}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    {/* Employee List */}
                    <div className="max-h-52 overflow-y-auto">
                      {filteredEmployees.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium">No employees found.</div>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const isSelected = form.participants.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${isSelected ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'hover:bg-white dark:hover:bg-slate-900/50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleParticipant(emp.id)}
                                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500/30 border-slate-300 cursor-pointer"
                              />
                              <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-[10px] font-black flex-shrink-0 overflow-hidden">
                                {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                                  <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  emp.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{emp.department} • {emp.position}</div>
                              </div>
                              {isSelected && <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0">✓</span>}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/30 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      editingId ? 'Save Changes' : 'Create Session'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
