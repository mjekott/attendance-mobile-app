import axios from 'axios';

// Change this to your server URL
const BASE_URL = 'https://attendace-api-crse.onrender.com/api';

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
