'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Tag, 
  MoreHorizontal, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  ShieldAlert, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Sparkles,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

interface Contact {
  id: string;
  phone: string;
  name: string;
  tags?: string[];
  status?: 'Active' | 'Opted In' | 'Idle' | 'Blacklisted';
  lastActive?: string;
  notes?: string;
}

interface ContactsDirectoryProps {
  contacts?: Contact[];
  onSelectContact?: (phone: string, id: string) => void;
  isReadOnly?: boolean;
}

const defaultMockContacts: Contact[] = [
  { id: 'c1', name: 'Sarah Jenkins', phone: '14155552671', tags: ['VIP Lead', 'WhatsApp Opt-In'], status: 'Active', lastActive: '2026-07-14T14:20:00Z', notes: 'Interested in annual enterprise tier.' },
  { id: 'c2', name: 'Alex Rivera', phone: '447911123456', tags: ['Customer', 'High Intent'], status: 'Active', lastActive: '2026-07-14T11:05:00Z', notes: 'Migrating from legacy SMS gateway.' },
  { id: 'c3', name: 'Marcus Chen', phone: '6591234567', tags: ['Support', 'Resolved'], status: 'Idle', lastActive: '2026-07-13T16:45:00Z', notes: 'Webhook signature verification issue solved.' },
  { id: 'c4', name: 'Elena Rostova', phone: '491512345678', tags: ['VIP Lead', 'Demo Booked'], status: 'Opted In', lastActive: '2026-07-13T09:15:00Z', notes: 'Scheduled live demo for Thursday afternoon.' },
  { id: 'c5', name: 'David Kim', phone: '821012345678', tags: ['New Contact'], status: 'Idle', lastActive: '2026-07-12T18:30:00Z' },
  { id: 'c6', name: 'Fatima Al-Mansoor', phone: '971501234567', tags: ['VIP Lead', 'Partner'], status: 'Active', lastActive: '2026-07-12T14:10:00Z' },
  { id: 'c7', name: 'Liam O’Connor', phone: '353861234567', tags: ['Opt-Out'], status: 'Blacklisted', lastActive: '2026-07-10T10:00:00Z' },
];

export function ContactsDirectory({
  contacts = defaultMockContacts,
  onSelectContact,
  isReadOnly = false
}: ContactsDirectoryProps) {
  const toast = useToast();
  const [contactList, setContactList] = useState<Contact[]>(contacts.length > 0 ? contacts : defaultMockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State for New Contact
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTag, setNewTag] = useState('VIP Lead');
  const [newNotes, setNewNotes] = useState('');

  // All unique tags across contacts
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contactList.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return ['all', ...Array.from(set)];
  }, [contactList]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contactList.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTagFilter === 'all' || (c.tags || []).includes(selectedTagFilter);
      return matchesSearch && matchesTag;
    });
  }, [contactList, searchQuery, selectedTagFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactIds(paginatedContacts.map(c => c.id));
    } else {
      setSelectedContactIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast.error('Validation Error', 'Phone number with country code is required.');
      return;
    }

    const created: Contact = {
      id: `c_${Date.now()}`,
      name: newName.trim() || 'New Customer',
      phone: newPhone.replace(/\D/g, ''),
      tags: [newTag],
      status: 'Active',
      lastActive: new Date().toISOString(),
      notes: newNotes.trim() || 'Added manually via Contact CRM Directory.'
    };

    setContactList([created, ...contactList]);
    setIsModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    toast.success('Contact Added', `Added ${created.name} (+${created.phone}) to directory.`);
  };

  const handleBulkExport = () => {
    toast.info('Exporting Contacts CSV', `Exporting ${selectedContactIds.length || filteredContacts.length} contacts to spreadsheet...`);
  };

  const handleBulkDelete = () => {
    setContactList(contactList.filter(c => !selectedContactIds.includes(c.id)));
    toast.warning('Bulk Deletion Completed', `Removed ${selectedContactIds.length} contacts from CRM.`);
    setSelectedContactIds([]);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-brandIndigo" /> Customer CRM Directory
            </h2>
            <Badge variant="indigo" size="sm">
              {contactList.length} Total Contacts
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your audience, segment with tags, view engagement history, and trigger direct WhatsApp sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleBulkExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="success"
            size="md"
            disabled={isReadOnly}
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add New Contact
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Opt-Ins</p>
            <p className="text-lg font-black text-white">{contactList.filter(c => c.status !== 'Blacklisted').length}</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">VIP Accounts</p>
            <p className="text-lg font-black text-white">{contactList.filter(c => (c.tags || []).includes('VIP Lead')).length}</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">24h Session Open</p>
            <p className="text-lg font-black text-white">{contactList.filter(c => c.status === 'Active').length}</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opt-Outs / Blocked</p>
            <p className="text-lg font-black text-white">{contactList.filter(c => c.status === 'Blacklisted').length}</p>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar & Bulk Actions Strip */}
      <Card variant="elevated" padding="none">
        <div className="p-4 border-b border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkSurface/50">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, phone (+1...), or notes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5 text-indigo-400" /> Filter Tag:
            </span>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTagFilter(t);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                  selectedTagFilter === t
                    ? 'bg-brandIndigo text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
                }`}
              >
                {t === 'all' ? 'All Segments' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action strip if items selected */}
        {selectedContactIds.length > 0 && (
          <div className="bg-indigo-950/40 border-b border-indigo-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-300">
            <span className="font-semibold">
              Selected <strong className="text-white">{selectedContactIds.length}</strong> contact{selectedContactIds.length > 1 ? 's' : ''} on this page
            </span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBulkExport}>Export Selected</Button>
              <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkBg/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-darkBorder">
                <th className="py-3.5 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedContacts.length > 0 && selectedContactIds.length === paginatedContacts.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded bg-darkBg border-darkBorder text-brandIndigo focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">CRM Segments</th>
                <th className="py-3.5 px-4">Session Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-400">No contacts matching criteria</p>
                    <p className="text-xs mt-1">Try resetting your search query or tag filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((c) => {
                  const isSelected = selectedContactIds.includes(c.id);
                  return (
                    <tr key={c.id} className={`hover:bg-slate-800/30 transition-colors group ${isSelected ? 'bg-indigo-500/10' : ''}`}>
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded bg-darkBg border-darkBorder text-brandIndigo focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-white leading-tight">{c.name}</p>
                            {c.notes && <p className="text-[11px] text-slate-400 font-normal truncate max-w-[180px] mt-0.5">{c.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>+{c.phone}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`+${c.phone}`);
                              toast.info('Copied', `+${c.phone} copied to clipboard.`);
                            }}
                            className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Copy phone"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags || []).map((t, idx) => (
                            <Badge
                              key={idx}
                              variant={t.includes('VIP') ? 'purple' : t.includes('Customer') ? 'emerald' : 'slate'}
                              size="sm"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            c.status === 'Active' ? 'emerald' :
                            c.status === 'Opted In' ? 'indigo' :
                            c.status === 'Blacklisted' ? 'rose' : 'slate'
                          }
                          size="sm"
                          pulse={c.status === 'Active'}
                        >
                          {c.status || 'Idle'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {c.lastActive ? new Date(c.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (onSelectContact) {
                                onSelectContact(c.phone, c.id);
                              } else {
                                toast.info('Opening Session', `Starting WhatsApp conversation with +${c.phone}`);
                              }
                            }}
                            leftIcon={<MessageSquare className="h-3.5 w-3.5 text-indigo-400" />}
                          >
                            Chat
                          </Button>
                          <button
                            onClick={() => {
                              setContactList(contactList.filter(item => item.id !== c.id));
                              toast.warning('Contact Deleted', `Removed ${c.name} from CRM directory.`);
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors outline-none"
                            title="Delete Contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-darkBorder flex items-center justify-between bg-darkSurface/50 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(currentPage * itemsPerPage, filteredContacts.length)}</strong> of{' '}
            <strong className="text-white">{filteredContacts.length}</strong> contacts
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Previous
            </Button>
            <span className="font-bold text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ADD CONTACT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer Contact"
        subtitle="Manually register a customer profile to send WhatsApp templates or manage CRM notes."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleAddContact} leftIcon={<Plus className="h-4 w-4" />}>
              Save Contact
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Elena Rostova"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            label="WhatsApp Phone Number (+CountryCode)"
            placeholder="e.g. +14155552671"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
            helperText="Include country code without spaces or dashes."
          />
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial CRM Segment Tag</label>
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="w-full bg-darkBg border border-darkBorder rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brandIndigo"
            >
              <option value="VIP Lead">VIP Lead</option>
              <option value="Customer">Customer</option>
              <option value="Support">Support Inquiry</option>
              <option value="Partner">Partner</option>
              <option value="New Contact">New Contact</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Internal Agent Notes</label>
            <textarea
              placeholder="Any background notes or account status..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-darkBg border border-darkBorder rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brandIndigo min-h-[80px]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
