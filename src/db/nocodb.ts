const BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL || 'https://app.nocodb.com/api/v2';
const API_TOKEN = import.meta.env.VITE_NOCODB_API_TOKEN || '';

export const Tables = {
  transactions: 'mwoyz00fgkwv1nz',
  categories: 'mrb9z3ayrw19chn',
  budgets: 'ma1pum55rsbsaxn',
  settings: 'mfuh51w2k9bspq7',
  users: 'm0ootw62wh5qqfg',
} as const;

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

function getHeaders(userToken?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userToken) {
    h['xc-auth'] = userToken;
  } else {
    h['xc-token'] = API_TOKEN;
  }
  return h;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NocoDB ${res.status}: ${body}`);
  }
  return res.json();
}

async function requestUser<T>(path: string, userToken: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(userToken),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NocoDB ${res.status}: ${body}`);
  }
  return res.json();
}

function buildQueryString(base: Record<string, string>, extra?: string): string {
  const params = new URLSearchParams({ pageSize: '1000', ...base });
  if (extra) {
    return `${params.toString()}&${extra}`;
  }
  return params.toString();
}

async function list(tableId: string, queryParams?: string | Record<string, string>, userToken?: string): Promise<NocoRecord[]> {
  const qs = typeof queryParams === 'string'
    ? `pageSize=1000&${queryParams}`
    : buildQueryString(queryParams || {});
  if (userToken) {
    return requestUser<NocoResponse>(`/tables/${tableId}/records?${qs}`, userToken).then((d) => d.list);
  }
  const data = await request<NocoResponse>(`/tables/${tableId}/records?${qs}`);
  return data.list;
}

async function listAll(tableId: string, queryParams?: string | Record<string, string>, userToken?: string): Promise<NocoRecord[]> {
  const all: NocoRecord[] = [];
  let page = 1;
  while (true) {
    const qs = typeof queryParams === 'string'
      ? `pageSize=1000&page=${page}&${queryParams}`
      : buildQueryString({ page: String(page), ...queryParams });
    const data = userToken
      ? await requestUser<NocoResponse>(`/tables/${tableId}/records?${qs}`, userToken)
      : await request<NocoResponse>(`/tables/${tableId}/records?${qs}`);
    all.push(...data.list);
    if (data.pageInfo.isLastPage) break;
    page++;
  }
  return all;
}

async function create(tableId: string, fields: Record<string, any>, userToken?: string): Promise<NocoRecord> {
  if (userToken) {
    return requestUser<NocoRecord>(`/tables/${tableId}/records`, userToken, {
      method: 'POST',
      body: JSON.stringify(fields),
    });
  }
  return request<NocoRecord>(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

async function createBulk(tableId: string, records: Record<string, any>[], userToken?: string): Promise<NocoRecord[]> {
  if (userToken) {
    return requestUser<NocoRecord[]>(`/tables/${tableId}/records`, userToken, {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }
  return request<NocoRecord[]>(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

async function update(tableId: string, recordId: string | number, fields: Record<string, any>, userToken?: string): Promise<NocoRecord> {
  if (userToken) {
    return requestUser<NocoRecord>(`/tables/${tableId}/records`, userToken, {
      method: 'PATCH',
      body: JSON.stringify({ Id: recordId, ...fields }),
    });
  }
  return request<NocoRecord>(`/tables/${tableId}/records`, {
    method: 'PATCH',
    body: JSON.stringify({ Id: recordId, ...fields }),
  });
}

async function remove(tableId: string, recordId: string | number, userToken?: string): Promise<void> {
  if (userToken) {
    await requestUser(`/tables/${tableId}/records`, userToken, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: recordId }]),
    });
    return;
  }
  await request(`/tables/${tableId}/records`, {
    method: 'DELETE',
    body: JSON.stringify([{ Id: recordId }]),
  });
}

async function count(tableId: string, userToken?: string): Promise<number> {
  if (userToken) {
    const data = await requestUser<{ count: number }>(`/tables/${tableId}/records/count`, userToken);
    return data.count;
  }
  const data = await request<{ count: number }>(`/tables/${tableId}/records/count`);
  return data.count;
}

export const nocodb = { list, listAll, create, createBulk, update, remove, count, request, requestUser };
