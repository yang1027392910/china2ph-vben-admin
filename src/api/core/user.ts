import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { requestClient } from '#/api/request';

export namespace AdminUserApi {
  export interface UserListQuery {
    page: number;
    pageSize: number;
    username?: string;
  }

  export interface UserPayload {
    email: string;
    name: string;
    role: string;
  }

  export type UserResponse = Record<string, any>;
}

function normalizeUserInfo(data?: Partial<UserInfo>): UserInfo {
  return {
    avatar: data?.avatar ?? preferences.app.defaultAvatar,
    desc: data?.desc ?? '',
    homePath: data?.homePath ?? preferences.app.defaultHomePath,
    realName: data?.realName ?? data?.username ?? 'Admin',
    roles: data?.roles ?? ['admin'],
    token: data?.token ?? '',
    userId: data?.userId ?? '1',
    username: data?.username ?? 'admin',
  };
}

export async function getUserInfoApi() {
  return normalizeUserInfo();
}

export function getAdminUserListApi(params?: AdminUserApi.UserListQuery) {
  return requestClient.get<AdminUserApi.UserResponse>('/admin/user/list', {
    params,
  });
}

export function createAdminUserApi(data: AdminUserApi.UserPayload) {
  return requestClient.post<AdminUserApi.UserResponse>(
    '/admin/user/list/created',
    data,
  );
}

export function deleteAdminUserApi(id: number | string) {
  return requestClient.delete<AdminUserApi.UserResponse>(
    `/admin/user/list/${id}`,
  );
}
