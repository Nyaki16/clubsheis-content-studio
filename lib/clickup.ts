import { SelectedClient } from '@/types';

export async function fetchClickUpClients(): Promise<SelectedClient[]> {
  const apiKey = process.env.CLICKUP_API_KEY;
  const workspaceId = process.env.CLICKUP_WORKSPACE_ID;

  if (!apiKey || !workspaceId) {
    return [];
  }

  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/team/${workspaceId}/space`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const spaces = data.spaces || [];

    return spaces.map((space: { id: string; name: string }) => ({
      id: `clickup-${space.id}`,
      name: space.name,
      brandColour: '#F5C842',
      tone: 'Match the brand voice for this client.',
      isOwnBrand: false,
    }));
  } catch {
    return [];
  }
}
