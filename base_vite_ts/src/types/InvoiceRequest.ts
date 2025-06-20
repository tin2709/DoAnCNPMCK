export interface InvoiceRequest {
    id: number;
    userId: number;
    orderId: number;
    statusId: number;
    createdAt: string;
}

export const INVOICE_STATUS_OPTIONS = [
    { id: 1, value: 'pending', label: 'Chờ xét duyệt' },
    { id: 2, value: 'rejected', label: 'Từ chối' },
    { id: 3, value: 'awaiting_payment', label: 'Chờ thanh toán' },
    { id: 4, value: 'paid', label: 'Đã thanh toán' },
]; 