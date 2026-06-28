<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

import { getLoginLogListApi } from '#/api';

type LoginLog = {
  account: string;
  browser: string;
  city: string;
  device: string;
  id: number | string;
  ip: string;
  loginAt: string;
  message: string;
  os: string;
  status: number | string;
};

const filters = reactive({
  account: '',
  ip: '',
  page: 1,
  pageSize: 10,
  status: undefined as string | undefined,
});

const logs = ref<LoginLog[]>([]);
const total = ref(0);
const queryLoading = ref(false);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '登录账号', dataIndex: 'account', key: 'account', width: 160 },
  { title: '登录状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '提示信息', dataIndex: 'message', key: 'message', width: 160 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '登录地点', dataIndex: 'city', key: 'city', width: 120 },
  { title: '设备', dataIndex: 'device', key: 'device', width: 120 },
  { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 140 },
  { title: '操作系统', dataIndex: 'os', key: 'os', width: 140 },
  { title: '登录时间', dataIndex: 'loginAt', key: 'loginAt', width: 180 },
];

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'fail' },
];

const statusMap: Record<string, { color: string; text: string }> = {
  0: { color: 'red', text: '失败' },
  1: { color: 'green', text: '成功' },
  fail: { color: 'red', text: '失败' },
  failed: { color: 'red', text: '失败' },
  success: { color: 'green', text: '成功' },
};

function normalizeLogs(data: any): LoginLog[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => ({
    account: String(
      item.account ?? item.username ?? item.userName ?? item.email ?? '',
    ),
    browser: String(item.browser ?? ''),
    city: String(item.city ?? item.location ?? item.address ?? ''),
    device: String(item.device ?? ''),
    id: item.id ?? '',
    ip: String(item.ip ?? ''),
    loginAt: String(item.loginAt ?? item.createdAt ?? item.createTime ?? ''),
    message: String(item.message ?? item.msg ?? item.remark ?? ''),
    os: String(item.os ?? item.operatingSystem ?? ''),
    status: item.status ?? item.sendStatus ?? '',
  }));
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

async function queryLogs() {
  try {
    queryLoading.value = true;
    const responseData = await getLoginLogListApi({
      account: filters.account.trim() || undefined,
      ip: filters.ip.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      status: filters.status,
    });
    logs.value = normalizeLogs(responseData);
    total.value = normalizeTotal(responseData, logs.value.length);
  } finally {
    queryLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  queryLogs();
}

function resetFilters() {
  filters.account = '';
  filters.ip = '';
  filters.page = 1;
  filters.status = undefined;
  queryLogs();
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  filters.page = pagination.current ?? 1;
  filters.pageSize = pagination.pageSize ?? 10;
  queryLogs();
}

function getStatusMeta(status: number | string) {
  return (
    statusMap[String(status)] ?? { color: 'default', text: String(status) }
  );
}

onMounted(() => {
  queryLogs();
});
</script>

<template>
  <Page title="登录日志">
    <Form class="mb-4" layout="inline">
      <Form.Item label="登录账号">
        <Input
          v-model:value="filters.account"
          allow-clear
          placeholder="请输入账号"
        />
      </Form.Item>
      <Form.Item label="IP 地址">
        <Input v-model:value="filters.ip" allow-clear placeholder="请输入 IP" />
      </Form.Item>
      <Form.Item label="登录状态">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="log-filter-select"
          placeholder="请选择"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button :loading="queryLoading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button @click="resetFilters">重置</Button>
        </Space>
      </Form.Item>
    </Form>

    <Table
      :columns="columns"
      :data-source="logs"
      :loading="queryLoading"
      :pagination="{
        current: filters.page,
        pageSize: filters.pageSize,
        showSizeChanger: true,
        total,
      }"
      :scroll="{ x: 1360 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusMeta(record.status).color">
            {{ getStatusMeta(record.status).text }}
          </Tag>
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof LoginLog] || '-' }}
        </template>
      </template>
    </Table>
  </Page>
</template>

<style scoped>
.log-filter-select {
  width: 140px;
}
</style>
