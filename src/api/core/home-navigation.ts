import { requestClient } from '#/api/request';

export namespace HomeNavigationApi {
  export interface HomeNavigationQuery {
    page: number;
    pageSize: number;
    status?: number | string;
    title?: string;
  }

  export interface HomeNavigationPayload {
    color: string;
    icon: string;
    jumpType: string;
    jumpValue: string;
    sort: number;
    status: number;
    title: string;
    value: string;
  }

  export interface HomeNavigationUpdatePayload
    extends HomeNavigationPayload {
    id: number | string;
  }

  export type HomeNavigationResponse = Record<string, any>;
}

export function getHomeNavigationListApi(
  params: HomeNavigationApi.HomeNavigationQuery,
) {
  return requestClient.get<HomeNavigationApi.HomeNavigationResponse>(
    '/admin/homeNavigation/list',
    { params },
  );
}

export function createHomeNavigationApi(
  data: HomeNavigationApi.HomeNavigationPayload,
) {
  return requestClient.post<HomeNavigationApi.HomeNavigationResponse>(
    '/admin/homeNavigation/list/created',
    data,
  );
}

export function updateHomeNavigationApi(
  data: HomeNavigationApi.HomeNavigationUpdatePayload,
) {
  return requestClient.post<HomeNavigationApi.HomeNavigationResponse>(
    '/admin/homeNavigation/list/update',
    data,
  );
}

export function deleteHomeNavigationApi(id: number | string) {
  return requestClient.post<HomeNavigationApi.HomeNavigationResponse>(
    '/admin/homeNavigation/list/dele',
    { id },
  );
}
