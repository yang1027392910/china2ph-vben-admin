import { requestClient } from '#/api/request';

export namespace LoginLogApi {
  export interface LoginLogListParams {
    account?: string;
    ip?: string;
    status?: string;
  }

  export type LoginLogResponse = Record<string, any>;
}

export function getLoginLogListApi(params?: LoginLogApi.LoginLogListParams) {
  return requestClient.get<LoginLogApi.LoginLogResponse>(
    '/admin/emailCodeLog/list',
    { params },
  );
}
