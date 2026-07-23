export {
  serviceOrderStatusClasses,
  serviceOrderStatusLabels,
  serviceOrderStatuses,
  type DatabaseServiceOrderStatus
} from '@/lib/service-order-constants';

import type { DatabaseServiceOrderStatus } from '@/lib/service-order-constants';

export type ServiceOrderRow = {
  id: string;
  number: number;
  status: DatabaseServiceOrderStatus;
  problemDescription: string;
  physicalCondition: string;
  accessories: string;
  estimatedValue: number;
  approvedValue: number | null;
  entryDate: string;
  dueDate: string | null;
  deliveredAt: string | null;
  warrantyDays: number;
  customerId: string;
  customerName: string;
  phone: string;
  document: string;
  deviceId: string;
  brand: string;
  model: string;
  color: string;
  imei: string;
  serialNumber: string;
  technicianId: string | null;
  technicianName: string;
};
