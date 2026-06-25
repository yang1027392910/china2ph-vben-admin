import { requestClient } from '#/api/request';

export namespace SupplierApi {
  export interface SupplierQuery {
    city?: string;
    keyword?: string;
    page: number;
    pageSize: number;
    status?: number | string;
  }

  export interface SupplierPayload {
    city: string;
    contact_whatsapp: string;
    description: string;
    images: string[];
    logo: string;
    main_products: string;
    moq: string;
    name: string;
    show_contact: number;
    sort: number;
    status: number;
  }

  export interface SupplierUpdatePayload extends SupplierPayload {
    id: number | string;
  }

  export type SupplierResponse = Record<string, any>;
}

export function getSupplierListApi(params: SupplierApi.SupplierQuery) {
  return requestClient.get<SupplierApi.SupplierResponse>(
    '/admin/supplier/list',
    {
      params,
    },
  );
}

export function createSupplierApi(data: SupplierApi.SupplierPayload) {
  return requestClient.post<SupplierApi.SupplierResponse>(
    '/admin/supplier/list/created',
    data,
  );
}

export function updateSupplierApi(data: SupplierApi.SupplierUpdatePayload) {
  return requestClient.post<SupplierApi.SupplierResponse>(
    '/admin/supplier/list/update',
    data,
  );
}

export function updateSupplierByIdApi(
  id: number | string,
  data: SupplierApi.SupplierPayload,
) {
  return requestClient.put<SupplierApi.SupplierResponse>(
    `/admin/supplier/list/${id}`,
    data,
  );
}

export function deleteSupplierApi(id: number | string) {
  return requestClient.post<SupplierApi.SupplierResponse>(
    '/admin/supplier/list/delete',
    { id },
  );
}
