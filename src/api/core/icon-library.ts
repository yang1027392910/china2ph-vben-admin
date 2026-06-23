import { requestClient } from '#/api/request';

export namespace IconLibraryApi {
  export interface IconLibraryPayload {
    iconValue: string;
  }

  export type IconLibraryResponse = Record<string, any>;
}

export function getIconLibraryListApi() {
  return requestClient.get<IconLibraryApi.IconLibraryResponse>(
    '/admin/iconLibrary/list',
  );
}

export function createIconLibraryApi(data: IconLibraryApi.IconLibraryPayload) {
  return requestClient.post<IconLibraryApi.IconLibraryResponse>(
    '/admin/iconLibrary/list/created',
    data,
  );
}
