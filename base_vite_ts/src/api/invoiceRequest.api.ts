import axios from 'axios';
import { InvoiceRequest } from '../types/InvoiceRequest';

export const fetchInvoiceRequests = async (token: string): Promise<InvoiceRequest[]> => {
  const response = await axios.get('http://localhost:8080/api/invoice-requests', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.map((item: any) => ({
    id: item.id,
    userId: item.user.id,
    orderId: item.order.id,
    statusId: item.status.id,
    createdAt: item.createdAt,
  }));
};

export const acceptInvoiceRequest = async (id: number, token: string) => {
  return axios.post(`http://localhost:8080/api/invoice-requests/${id}/accept`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const rejectInvoiceRequest = async (id: number, token: string) => {
  return axios.post(`http://localhost:8080/api/invoice-requests/${id}/reject`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}; 