import { requestClient } from '#/api/request';

export namespace ProductApi {
  export interface SupplierContactFields {
    showSupplierContact: number;
    supplierName: string;
    supplierPhone: string;
    supplierWechat: string;
    supplierWhatsapp: string;
  }

  export interface ProductPayload extends SupplierContactFields {
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

  export interface ProductUpdatePayload extends ProductPayload {
    id: number | string;
  }

  export interface ProductListParams {
    title?: string;
  }

  export interface ContactPermission {
    createdAt: string;
    email: string;
    userId: number;
  }

  export interface ContactPermissionPayload {
    userId: number;
  }

  export type ContactPermissionResponse = ContactPermission[];
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

export function getProductListApi(params?: ProductApi.ProductListParams) {
  return requestClient.get<ProductApi.ProductResponse>('/admin/product/list', {
    params,
  });
}

export function createProductApi(data: ProductApi.ProductPayload) {
  return requestClient.post<ProductApi.ProductResponse>(
    '/admin/product/list/created',
    data,
  );
}

export function updateProductApi(data: ProductApi.ProductUpdatePayload) {
  return requestClient.post<ProductApi.ProductResponse>(
    '/admin/product/list/update',
    data,
  );
}

export function getProductContactPermissionsApi(productId: number | string) {
  return requestClient.get<ProductApi.ContactPermissionResponse>(
    `/admin/product/${productId}/contact-permission`,
  );
}

export function addProductContactPermissionApi(
  productId: number | string,
  userId: number,
) {
  const data: ProductApi.ContactPermissionPayload = { userId };
  return requestClient.post<ProductApi.ContactPermission>(
    `/admin/product/${productId}/contact-permission`,
    data,
  );
}

export function deleteProductContactPermissionApi(
  productId: number | string,
  userId: number,
) {
  return requestClient.delete(
    `/admin/product/${productId}/contact-permission/${userId}`,
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
