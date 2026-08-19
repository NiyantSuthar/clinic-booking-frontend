import { API_BASE_URL } from './config';

export async function listBeneficiaries(token) {
  const response = await fetch(`${API_BASE_URL}/beneficiaries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Could not load beneficiaries.');
  }
  return data;
}

export async function addBeneficiary(token, name, relation) {
  const response = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, relation: relation || null }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.name || 'Could not add beneficiary.');
  }
  return data;
}

/** Matches the DELETE /beneficiaries/{id} endpoint already built in Session 5. */
export async function removeBeneficiary(token, id) {
  const response = await fetch(`${API_BASE_URL}/beneficiaries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Could not remove beneficiary.');
  }
  // 204 No Content - nothing to parse.
}