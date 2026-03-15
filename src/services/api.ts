import axios from 'axios';

// Change this to your server URL
const BASE_URL = 'http://192.168.1.3:3000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

export const attendanceApi = {
  verify: async (
    token: string,
    embedding: number[],
    action: 'CHECKIN' | 'CHECKOUT',
  ) => {
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
      { embedding, action },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },
};
