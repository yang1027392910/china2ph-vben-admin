import { requestClient } from '#/api/request';

export namespace OrderApi {
  export type Id = number | string;
  export interface Query {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: number | string;
    userName?: string;
  }
  export interface Item {
    [key: string]: unknown;
    id: Id;
    quantity: number;
  }
  export interface Order {
    [key: string]: unknown;
    deliveryType?: number | string;
    id: Id;
    items?: Item[];
    remark?: string;
    status?: number | string;
  }
  export interface List {
    list?: Order[];
    pagination?: { total?: number };
    records?: Order[];
    rows?: Order[];
    total?: number;
  }
  export interface Update {
    deliveryType?: number | string;
    id: Id;
    remark?: string;
    status?: number | string;
  }
}

// The shared base URL includes /api; its interceptor adds the Bearer token.
export function getOrderListApi(params: OrderApi.Query) {
  return requestClient.get<OrderApi.List | OrderApi.Order[]>(
    '/admin/order/list',
    { params },
  );
}

export function getOrderDetailApi(id: OrderApi.Id) {
  return requestClient.get<OrderApi.Order>('/admin/order/detail', {
    params: { id },
  });
}

export function updateOrderApi(data: OrderApi.Update) {
  return requestClient.put('/admin/order/update', data);
}

export function updateOrderItemApi(data: {
  id: OrderApi.Id;
  quantity: number;
}) {
  return requestClient.put('/admin/order/item/update', data);
}
