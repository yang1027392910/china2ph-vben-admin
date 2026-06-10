import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  type LoginResponseData = {
    accessToken?: string;
    token?: string;
  };

  export interface LoginResult {
    accessToken: string;
  }

  export type LoginResponse =
    | LoginResponseData
    | {
        code?: number | string;
        data?: LoginResponseData | string;
      };

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  const response = await baseRequestClient.post<AuthApi.LoginResponse>(
    '/admin/login',
    {
      password: data.password,
      username: data.username,
    },
  );
  const loginData = (response as any)?.data ?? response;
  const accessToken =
    typeof loginData === 'string'
      ? loginData
      : loginData?.data?.accessToken ||
        loginData?.data?.token ||
        loginData?.accessToken ||
        loginData?.token;

  return { accessToken };
}

export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

export async function getAccessCodesApi() {
  try {
    return await requestClient.get<string[]>('/auth/codes');
  } catch {
    return [];
  }
}
