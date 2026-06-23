import { requestClient } from '#/api/request';

export namespace BannerApi {
  export interface BannerQuery {
    keyword?: string;
    page: number;
    pageSize: number;
    status?: number | string;
  }

  export interface BannerPayload {
    actionType: string;
    actionValue: string;
    endTime: string;
    image: string;
    pageType: string;
    scene: string;
    sort: number;
    startTime: string;
    status: number;
    subtitle: string;
    title: string;
  }

  export interface BannerDeletePayload {
    id: number | string;
  }

  export interface BannerUpdatePayload extends BannerPayload {
    id: number | string;
  }

  export type BannerResponse = Record<string, any>;
}

export function getBannerListApi(params: BannerApi.BannerQuery) {
  return requestClient.get<BannerApi.BannerResponse>('/admin/banner/list', {
    params,
  });
}

export function createBannerApi(data: BannerApi.BannerPayload) {
  return requestClient.post<BannerApi.BannerResponse>(
    '/admin/banner/list/created',
    data,
  );
}

export function deleteBannerApi(data: BannerApi.BannerDeletePayload) {
  return requestClient.post<BannerApi.BannerResponse>(
    '/admin/banner/list/dele',
    data,
  );
}

export function updateBannerApi(data: BannerApi.BannerUpdatePayload) {
  return requestClient.post<BannerApi.BannerResponse>(
    '/admin/banner/list/update',
    data,
  );
}
