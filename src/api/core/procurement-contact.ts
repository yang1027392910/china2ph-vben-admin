import { requestClient } from '#/api/request';

export namespace ProcurementContactApi {
  export interface ProcurementContactQuery {
    contactType?: string;
    page: number;
    pageSize: number;
    status?: number | string;
  }

  export interface ProcurementContactPayload {
    contact_type: string;
    contact_value: string;
    description: string;
    sort: number;
    status: number;
  }

  export interface ProcurementContactUpdatePayload extends ProcurementContactPayload {
    id: number | string;
  }

  export type ProcurementContactResponse = Record<string, any>;
}

export function getProcurementContactListApi(
  params: ProcurementContactApi.ProcurementContactQuery,
) {
  return requestClient.get<ProcurementContactApi.ProcurementContactResponse>(
    '/admin/procurement-contact/list',
    { params },
  );
}

export function createProcurementContactApi(
  data: ProcurementContactApi.ProcurementContactPayload,
) {
  return requestClient.post<ProcurementContactApi.ProcurementContactResponse>(
    '/admin/procurement-contact/create',
    data,
  );
}

export function updateProcurementContactApi(
  data: ProcurementContactApi.ProcurementContactUpdatePayload,
) {
  return requestClient.put<ProcurementContactApi.ProcurementContactResponse>(
    '/admin/procurement-contact/update',
    data,
  );
}

export function deleteProcurementContactApi(id: number | string) {
  return requestClient.delete<ProcurementContactApi.ProcurementContactResponse>(
    `/admin/procurement-contact/delete/${id}`,
  );
}
