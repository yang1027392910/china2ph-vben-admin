import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { requestClient } from '#/api/request';

type UserInfoResponse =
  | Partial<UserInfo>
  | {
      data?: Partial<UserInfo>;
    };

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
  try {
    const response =
      await requestClient.get<UserInfoResponse>('/auth/admin/info');
    const responseData = response as any;
    const userInfo = responseData?.data ?? responseData;

    return normalizeUserInfo(userInfo);
  } catch {
    return normalizeUserInfo();
  }
}
