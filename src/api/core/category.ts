import { requestClient } from '#/api/request';

export namespace CategoryApi {
  export type CategoryId = number | string;

  export interface CategoryListParams {
    status?: string;
  }

  export interface CategoryPayload {
    alice?: string;
    icon?: string;
    name: string;
    sort: number;
    status: string;
  }

  export interface CategoryUpdatePayload extends Partial<CategoryPayload> {
    id: CategoryId;
  }

  export type CategoryResponse = Record<string, any>;
  export type UploadResponse = Record<string, any> | string;
}

export function getCategoryListApi(params?: CategoryApi.CategoryListParams) {
  return requestClient.get<CategoryApi.CategoryResponse>(
    '/admin/category/list',
    { params },
  );
}

export function createCategoryApi(data: CategoryApi.CategoryPayload) {
  return requestClient.post<CategoryApi.CategoryResponse>(
    '/admin/category/list/created',
    data,
  );
}

export function updateCategoryApi(data: CategoryApi.CategoryUpdatePayload) {
  return requestClient.post<CategoryApi.CategoryResponse>(
    '/admin/category/list/update',
    data,
  );
}

export function deleteCategoryApi(id: CategoryApi.CategoryId) {
  return requestClient.delete(`/admin/category/list/dele/${id}`);
}

export function uploadAdminFileApi(file: File) {
  return requestClient.upload<CategoryApi.UploadResponse>('/admin/upload', {
    file,
  });
}
