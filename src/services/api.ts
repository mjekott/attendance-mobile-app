import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  loginKiosk: async (secretKey: string) => {
    const { data } = await apiClient.post<{
      accessToken: string;
      kiosk: { id: string; name: string; location: string };
    }>('/auth/kiosk/login', { secretKey });
    return data;
  },
};

export const usersApi = {
  create: async (
    token: string,
    user: { name: string; employeeId: string; department?: string },
  ) => {
    const { data } = await apiClient.post<{
      id: string;
      name: string;
      employeeId: string;
    }>('/users', user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

export const embeddingsApi = {
  enroll: async (
    token: string,
    userId: string,
    vectors: number[][],
  ) => {
    const { data } = await apiClient.post<{
      userId: string;
      enrolledCount: number;
    }>(
      '/embeddings/enroll',
      { userId, vectors },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },
};

export const attendanceApi = {
  verify: async (
    token: string,
    embedding: number[],
    employeeId: string,
    action?: 'CHECKIN' | 'CHECKOUT',
  ) => {
    const body: Record<string, unknown> = { embedding, employeeId };
    if (action) body.action = action;

    const { data } = await apiClient.post<{
      matched: boolean;
      userId?: string;
      userName?: string;
      confidence?: number;
      action?: string;
      alreadyCheckedIn?: boolean;
      alreadyCheckedOut?: boolean;
      checkedIn?: string;
      checkedOut?: string;
      message: string;
    }>(
      '/attendance/verify',
      body,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },
};

export const kioskApi = {
  updateStatus: async (token: string, status: 'online' | 'offline') => {
    await apiClient.patch(
      '/kiosks/status',
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },
};

export const syncApi = {
  getUserEmbeddings: async (token: string, employeeId: string) => {
    const { data } = await apiClient.get<{
      id: string;
      employeeId: string;
      name: string;
      embeddings: number[][];
    }>(`/users/${employeeId}/embeddings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
  getGatePasses: async (token: string) => {
    const { data } = await apiClient.get<Array<{
      accessCode: string;
      visitorName: string;
      hostName: string;
      purpose: string;
      status: string;
      expectedDate: string;
      checkedIn: string | null;
      checkedOut: string | null;
    }>>('/sync/gate-passes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
  pushQueue: async (token: string, records: any[]) => {
    const { data } = await apiClient.post<{
      processed: number;
      errors: { index: number; error: string }[];
    }>('/sync/queue', { records }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

export const visitorsApi = {
  verify: async (token: string, accessCode: string) => {
    const { data } = await apiClient.post<{
      valid: boolean;
      visitorName?: string;
      hostName?: string;
      purpose?: string;
      action?: string;
      checkedIn?: string;
      checkedOut?: string;
      message: string;
    }>(
      '/visitors/verify',
      { accessCode },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },
};
