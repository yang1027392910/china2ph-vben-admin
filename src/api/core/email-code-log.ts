import { requestClient } from '#/api/request';

export namespace EmailCodeLogApi {
  export interface EmailCodeLogListParams {
    email?: string;
    page?: number;
    pageSize?: number;
    scene?: string;
    status?: number;
  }

  export type EmailCodeLogResponse = Record<string, any>;
}

export function getEmailCodeLogListApi(
  params?: EmailCodeLogApi.EmailCodeLogListParams,
) {
  return requestClient.get<EmailCodeLogApi.EmailCodeLogResponse>(
    '/admin/emailCodeLog/list',
    { params },
  );
}
