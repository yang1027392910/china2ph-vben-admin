import { requestClient } from '#/api/request';

export namespace LogisticsSupplierApi {
  export interface LogisticsSupplierQuery {
    keyword?: string;
    page: number;
    pageSize: number;
    shippingMethod?: string;
    status?: number | string;
  }

  export interface LogisticsSupplierPayload {
    deliveryTime: string;
    logo?: string;
    name: string;
    pricingMethod: string;
    shippingMethod: string;
    sort: number;
    status: number;
    unitPrice: number;
  }

  export interface LogisticsSupplierUpdatePayload extends LogisticsSupplierPayload {
    id: number | string;
  }

  export type LogisticsSupplierResponse = Record<string, any>;
}

export function getLogisticsSupplierListApi(
  params: LogisticsSupplierApi.LogisticsSupplierQuery,
) {
  return requestClient.get<LogisticsSupplierApi.LogisticsSupplierResponse>(
    '/admin/logisticsSupplier/list',
    { params },
  );
}

export function createLogisticsSupplierApi(
  data: LogisticsSupplierApi.LogisticsSupplierPayload,
) {
  return requestClient.post<LogisticsSupplierApi.LogisticsSupplierResponse>(
    '/admin/logisticsSupplier/list/created',
    data,
  );
}

export function updateLogisticsSupplierApi(
  data: LogisticsSupplierApi.LogisticsSupplierUpdatePayload,
) {
  return requestClient.post<LogisticsSupplierApi.LogisticsSupplierResponse>(
    '/admin/logisticsSupplier/list/update',
    data,
  );
}

export function deleteLogisticsSupplierApi(id: number | string) {
  return requestClient.post<LogisticsSupplierApi.LogisticsSupplierResponse>(
    '/admin/logisticsSupplier/list/delete',
    { id },
  );
}
