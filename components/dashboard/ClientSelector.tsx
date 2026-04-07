'use client';

import { useState } from 'react';
import { SelectedClient } from '@/types';
import { hardcodedClients } from '@/lib/clients';

interface Props {
  selectedClient: SelectedClient | null;
  onSelect: (client: SelectedClient) => void;
}

export default function ClientSelector({ selectedClient, onSelect }: Props) {
  const [clients, setClients] = useState<SelectedClient[]>(hardcodedClients);
  const [fetchingClickUp, setFetchingClickUp] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    brandColour: '#7B4B2A',
    tone: '',
  });

  const fetchFromSystem = async () => {
    setFetchingClickUp(true);
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
      // Falls back silently to hardcoded list
    } finally {
      setFetchingClickUp(false);
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
    onSelect(client);
  };

  return (
    <div>
      <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">
        Active Clients
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelect(client)}
            className={`flex items-center gap-4 px-5 py-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-md text-left ${
              selectedClient?.id === client.id
                ? 'border-brown shadow-md ring-1 ring-brown/20'
                : 'border-border-light hover:border-border'
            }`}
          >
            <span
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-ui font-bold text-sm"
              style={{ backgroundColor: client.brandColour }}
            >
              {client.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <span className="font-ui font-semibold text-sm text-text-primary block truncate">
                {client.name}
              </span>
              {client.isOwnBrand && (
                <span className="text-[10px] font-ui font-semibold text-brown bg-orange-light rounded-full px-2 py-0.5 mt-1 inline-block">
                  Own Brand
                </span>
              )}
            </div>
          </button>
        ))}

        <button
          onClick={fetchFromSystem}
          disabled={fetchingClickUp}
          className="flex items-center gap-4 px-5 py-4 bg-white/50 rounded-xl border border-dashed border-border hover:border-brown/40 transition-all duration-200 text-text-muted hover:text-text-secondary"
        >
          <span className="w-10 h-10 rounded-full flex-shrink-0 bg-cream-dark flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </span>
          <span className="font-ui font-medium text-sm">
            {fetchingClickUp ? 'Fetching...' : 'Fetch from system'}
          </span>
        </button>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-4 px-5 py-4 bg-white/50 rounded-xl border border-dashed border-border hover:border-brown/40 transition-all duration-200 text-text-muted hover:text-text-secondary"
        >
          <span className="w-10 h-10 rounded-full flex-shrink-0 bg-cream-dark flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <span className="font-ui font-medium text-sm">Add client</span>
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 p-5 bg-white rounded-xl border border-border-light max-w-md">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Client name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
            />
            <div className="flex gap-3 items-center">
              <label className="font-ui text-xs text-text-muted">
                Brand colour
              </label>
              <input
                type="color"
                value={newClient.brandColour}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    brandColour: e.target.value,
                  }))
                }
                className="w-8 h-8 rounded border border-border-light cursor-pointer"
              />
            </div>
            <input
              type="text"
              placeholder="Brand tone (e.g. warm, professional, bold)"
              value={newClient.tone}
              onChange={(e) =>
                setNewClient((prev) => ({ ...prev, tone: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
            />
            <button
              onClick={addNewClient}
              className="bg-brown text-white font-ui font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-brown-light transition-colors"
            >
              Add Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
