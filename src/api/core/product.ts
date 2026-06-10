import { requestClient } from '#/api/request';

export namespace ProductApi {
  export interface ProductPayload {
    categoryId: number;
    chinaPrice: number;
    cover: string;
    description: string;
    images: string[];
    minimumOrderQuantity: number;
    phPrice: number;
    profit: number;
    sales: number;
    shippingFee: number;
    status: number;
    stock: number;
    subtitle: string;
    title: string;
  }

  export type ProductResponse = Record<string, any>;
  export type UploadResponse = Record<string, any> | string;

  export interface HotProductQuery {
    hotType?: string;
    keyword?: string;
    page: number;
    pageSize: number;
    period?: string;
    status?: number | string;
  }

  export interface HotProductPayload {
    hotType: string;
    productId: number;
    sort: number;
    status: number;
  }

  export interface HotProductDeletePayload {
    id: number | string;
  }
}

export function getProductListApi() {
  return requestClient.get<ProductApi.ProductResponse>('/admin/product/list');
}

export function createProductApi(data: ProductApi.ProductPayload) {
  return requestClient.post<ProductApi.ProductResponse>(
    '/admin/product/list/created',
    data,
  );
}

export function uploadProductImageApi(file: File) {
  return requestClient.upload<ProductApi.UploadResponse>('/admin/upload', {
    file,
  });
}

export function getHotProductListApi(params: ProductApi.HotProductQuery) {
  return requestClient.get<ProductApi.ProductResponse>(
    '/admin/hotProduct/list',
    {
      params,
    },
  );
}

export function createHotProductApi(data: ProductApi.HotProductPayload) {
  return requestClient.post<ProductApi.ProductResponse>(
    '/admin/hotProduct/list/created',
    data,
  );
}

export function deleteHotProductApi(data: ProductApi.HotProductDeletePayload) {
  return requestClient.post<ProductApi.ProductResponse>(
    '/admin/hotProduct/list/delete',
    data,
  );
}
