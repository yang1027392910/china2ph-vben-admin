import { requestClient } from '#/api/request';

export namespace CouponApi {
  export type Type = 1 | 2 | 3;
  export type Status = 0 | 1 | 2 | 3 | 4;
  export type Source = 1 | 2;
  export interface ConfigPayload {
    amount: number | string;
    enabled: boolean;
    validDays: number;
  }
  export interface Config extends ConfigPayload {
    amount: string;
    id: number;
    type: 1 | 2;
    typeName: string;
  }
  export interface Coupon {
    activatedAt: null | string;
    amount: string;
    avatar?: null | string;
    createdAt: string;
    email: null | string;
    expiredAt: null | string;
    id: number;
    nickname: null | string;
    orderId: null | number | string;
    remark: null | string;
    source: Source;
    sourceName: string;
    status: Status;
    statusName: string;
    type: Type;
    typeName: string;
    updatedAt: string;
    usedAt: null | string;
    userId: number;
  }
  export interface ListQuery {
    endDate?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    source?: Source;
    startDate?: string;
    status?: Status;
    type?: Type;
  }
  export interface ListResult {
    list: Coupon[];
    page: number;
    pageSize: number;
    total: number;
  }
  export interface SendPayload {
    amount: number | string;
    remark?: string;
    userId: number;
    validDays: number;
  }
}

export function getCouponConfigsApi() {
  return requestClient.get<CouponApi.Config[]>('/admin/coupon/config');
}
export function updateCouponConfigApi(
  id: number,
  data: CouponApi.ConfigPayload,
) {
  const { amount, validDays, enabled } = data;
  return requestClient.put<null>(`/admin/coupon/config/${id}`, {
    amount,
    validDays,
    enabled,
  });
}
export function getCouponListApi(params: CouponApi.ListQuery) {
  return requestClient.get<CouponApi.ListResult>('/admin/coupon/user/list', {
    params,
  });
}
export function getCouponDetailApi(id: number) {
  return requestClient.get<CouponApi.Coupon>(`/admin/coupon/user/${id}`);
}
export function sendCouponApi(data: CouponApi.SendPayload) {
  const { userId, amount, validDays, remark } = data;
  return requestClient.post<CouponApi.Coupon>('/admin/coupon/send', {
    userId,
    amount,
    validDays,
    ...(remark ? { remark } : {}),
  });
}
export function disableCouponApi(id: number) {
  return requestClient.put<null>(`/admin/coupon/user/${id}/disable`);
}
