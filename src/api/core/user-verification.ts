import { requestClient } from '#/api/request';

export namespace UserVerificationApi {
  export type VerificationStatus = 0 | 1 | 2;

  export interface VerificationRecord {
    address: string;
    businessType: string;
    city: string;
    createdAt: string;
    email: string;
    fullName: string;
    id: number | string;
    phone: string;
    remark: string;
    reviewedAt: string;
    shopName: string;
    status: VerificationStatus;
    storeDescription: string;
    storePhotos: string[];
    updatedAt: string;
    userName: string;
  }

  export interface VerificationListQuery {
    keyword?: string;
    page: number;
    pageSize: number;
    status?: VerificationStatus;
  }

  export interface VerificationListResponse {
    list?: VerificationRecord[];
    pagination?: {
      total?: number;
    };
    records?: VerificationRecord[];
    rows?: VerificationRecord[];
    total?: number;
  }

  export interface ReviewPayload {
    remark?: string;
  }

  export type ReviewResponse = Record<string, any>;
}

export function getUserVerificationListApi(
  params: UserVerificationApi.VerificationListQuery,
) {
  return requestClient.get<UserVerificationApi.VerificationListResponse>(
    '/admin/user-verification/list',
    { params },
  );
}

export function approveUserVerificationApi(
  id: number | string,
  data: UserVerificationApi.ReviewPayload,
) {
  return requestClient.post<UserVerificationApi.ReviewResponse>(
    `/admin/user-verification/${id}/approve`,
    data,
  );
}

export function rejectUserVerificationApi(
  id: number | string,
  data: UserVerificationApi.ReviewPayload,
) {
  return requestClient.post<UserVerificationApi.ReviewResponse>(
    `/admin/user-verification/${id}/reject`,
    data,
  );
}
