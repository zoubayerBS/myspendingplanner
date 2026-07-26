const BASE_URL = 'https://app.nocodb.com/api/v2';
const API_TOKEN = 'nc_pat_lsl4BTD2n9ROGOHaU3hF6JU7oQz42Xt7hQEqU3u6';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'xc-token': API_TOKEN,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NocoDB ${res.status}: ${body}`);
  }
  return res.json();
}

export type NocoRecord = Record<string, any> & { Id: number };

export interface NocoResponse {
  list: NocoRecord[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

export const Tables = {
  transactions: 'mwoyz00fgkwv1nz',
  categories: 'mrb9z3ayrw19chn',
  budgets: 'ma1pum55rsbsaxn',
  settings: 'mfuh51w2k9bspq7',
} as const;

async function list(tableId: string, queryParams?: Record<string, string>): Promise<NocoRecord[]> {
  const params = new URLSearchParams({ pageSize: '1000', ...queryParams });
  const data = await request<NocoResponse>(`/tables/${tableId}/records?${params}`);
  return data.list;
}

async function listAll(tableId: string): Promise<NocoRecord[]> {
  const all: NocoRecord[] = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({ pageSize: '1000', page: String(page) });
    const data = await request<NocoResponse>(`/tables/${tableId}/records?${params}`);
    all.push(...data.list);
    if (data.pageInfo.isLastPage) break;
    page++;
  }
  return all;
}

async function create(tableId: string, fields: Record<string, any>): Promise<NocoRecord> {
  return request<NocoRecord>(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

async function createBulk(tableId: string, records: Record<string, any>[]): Promise<NocoRecord[]> {
  return request<NocoRecord[]>(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

async function update(tableId: string, recordId: string | number, fields: Record<string, any>): Promise<NocoRecord> {
  return request<NocoRecord>(`/tables/${tableId}/records`, {
    method: 'PATCH',
    body: JSON.stringify({ Id: recordId, ...fields }),
  });
}

async function remove(tableId: string, recordId: string | number): Promise<void> {
  await request(`/tables/${tableId}/records`, {
    method: 'DELETE',
    body: JSON.stringify([{ Id: recordId }]),
  });
}

async function count(tableId: string): Promise<number> {
  const data = await request<{ count: number }>(`/tables/${tableId}/records/count`);
  return data.count;
}

export const nocodb = { list, listAll, create, createBulk, update, remove, count };
