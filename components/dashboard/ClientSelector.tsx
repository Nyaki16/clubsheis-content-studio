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
    brandColour: '#F5C842',
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
    setNewClient({ name: '', brandColour: '#F5C842', tone: '' });
    setShowAddForm(false);
    onSelect(client);
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-1">
        SELECT CLIENT
      </h2>
      <p className="font-ui text-sm text-grey-mid mb-6">
        Choose who this content is for
      </p>

      <div className="flex flex-wrap gap-4">
        {clients.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelect(client)}
            className={`flex items-center gap-3 px-5 py-4 border-2 transition-all duration-200 hover:shadow-md ${
              selectedClient?.id === client.id
                ? 'border-yellow bg-white shadow-md'
                : 'border-grey-light bg-white hover:border-grey-mid'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: client.brandColour }}
            />
            <span className="font-ui font-medium text-sm">
              {client.name}
            </span>
            {client.isOwnBrand && (
              <span className="text-[10px] font-ui font-semibold bg-yellow text-black px-2 py-0.5 tracking-wider">
                OWN BRAND
              </span>
            )}
          </button>
        ))}

        <button
          onClick={fetchFromSystem}
          disabled={fetchingClickUp}
          className="flex items-center gap-3 px-5 py-4 border-2 border-dashed border-grey-mid hover:border-yellow transition-all duration-200 text-grey-mid hover:text-black"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="font-ui font-medium text-sm">
            {fetchingClickUp ? 'Fetching...' : 'Fetch from system'}
          </span>
        </button>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-3 px-5 py-4 border-2 border-dashed border-grey-mid hover:border-yellow transition-all duration-200 text-grey-mid hover:text-black"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="font-ui font-medium text-sm">Add client</span>
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 p-5 border border-grey-light bg-white max-w-md">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Client name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow"
            />
            <div className="flex gap-3 items-center">
              <label className="font-ui text-xs text-grey-mid">
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
                className="w-8 h-8 border border-grey-light cursor-pointer"
              />
            </div>
            <input
              type="text"
              placeholder="Brand tone (e.g. warm, professional, bold)"
              value={newClient.tone}
              onChange={(e) =>
                setNewClient((prev) => ({ ...prev, tone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow"
            />
            <button
              onClick={addNewClient}
              className="bg-black text-yellow font-display tracking-widest px-6 py-2 hover:bg-yellow hover:text-black transition-colors"
            >
              ADD CLIENT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
