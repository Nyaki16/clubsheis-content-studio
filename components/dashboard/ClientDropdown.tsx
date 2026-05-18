'use client';

import { useState } from 'react';
import { SelectedClient } from '@/types';
import { hardcodedClients } from '@/lib/clients';

interface Props {
  selectedClient: SelectedClient;
  onSelect: (client: SelectedClient) => void;
}

export default function ClientDropdown({ selectedClient, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<SelectedClient[]>(hardcodedClients);
  const [fetching, setFetching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    brandColour: '#7B4B2A',
    tone: '',
  });

  const fetchFromSystem = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setClients((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newClients = data.filter(
              (c: SelectedClient) => !existingIds.has(c.id)
            );
            return [...prev, ...newClients];
          });
        }
      }
    } catch {
      // Falls back silently to existing list
    } finally {
      setFetching(false);
    }
  };

  const addNewClient = () => {
    if (!newClient.name.trim()) return;
    const client: SelectedClient = {
      id: `custom-${Date.now()}`,
      name: newClient.name,
      brandColour: newClient.brandColour,
      tone: newClient.tone || 'Professional and approachable.',
      isOwnBrand: false,
    };
    setClients((prev) => [...prev, client]);
    setNewClient({ name: '', brandColour: '#7B4B2A', tone: '' });
    setShowAddForm(false);
    setOpen(false);
    onSelect(client);
  };

  const pick = (client: SelectedClient) => {
    setOpen(false);
    setShowAddForm(false);
    onSelect(client);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border-light hover:border-brown transition-colors"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedClient.brandColour }}
        />
        <span className="font-ui text-sm font-medium text-text-primary max-w-[180px] truncate">
          {selectedClient.name}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close client menu"
            onClick={() => {
              setOpen(false);
              setShowAddForm(false);
            }}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-border-light shadow-lg z-50 overflow-hidden">
            <div className="max-h-72 overflow-y-auto py-1">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => pick(client)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-cream transition-colors ${
                    selectedClient.id === client.id ? 'bg-cream' : ''
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-ui font-bold text-xs"
                    style={{ backgroundColor: client.brandColour }}
                  >
                    {client.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="font-ui font-semibold text-sm text-text-primary block truncate">
                      {client.name}
                    </span>
                    {client.isOwnBrand && (
                      <span className="font-ui text-[10px] font-semibold text-brown">
                        Own Brand
                      </span>
                    )}
                  </span>
                  {selectedClient.id === client.id && (
                    <svg className="w-4 h-4 text-brown ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border-light p-1">
              <button
                onClick={fetchFromSystem}
                disabled={fetching}
                className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-cream transition-colors font-ui text-sm text-text-secondary"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {fetching ? 'Fetching...' : 'Fetch from system'}
              </button>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-cream transition-colors font-ui text-sm text-text-secondary"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Add client
              </button>
            </div>

            {showAddForm && (
              <div className="border-t border-border-light p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Client name"
                  value={newClient.name}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
                />
                <div className="flex gap-2 items-center">
                  <label className="font-ui text-xs text-text-muted">Brand colour</label>
                  <input
                    type="color"
                    value={newClient.brandColour}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, brandColour: e.target.value }))}
                    className="w-8 h-8 rounded border border-border-light cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Brand tone (e.g. warm, professional, bold)"
                  value={newClient.tone}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
                />
                <button
                  onClick={addNewClient}
                  className="w-full bg-brown text-white font-ui font-semibold rounded-full px-4 py-2 text-sm hover:bg-brown-light transition-colors"
                >
                  Add Client
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
