<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

import { getLoginLogListApi } from '#/api';
import { $t } from '#/locales';

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

const columns = computed(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: $t('app.loginAccount'), dataIndex: 'account', key: 'account', width: 160 },
  { title: $t('app.loginStatus'), dataIndex: 'status', key: 'status', width: 110 },
  { title: $t('app.loginLocation'), dataIndex: 'city', key: 'city', width: 120 },
  { title: $t('app.device'), dataIndex: 'device', key: 'device', width: 120 },
  { title: $t('app.operatingSystem'), dataIndex: 'os', key: 'os', width: 140 },
  { title: $t('app.loginTime'), dataIndex: 'loginAt', key: 'loginAt', width: 180 },
]));

const statusOptions = computed(() => ([
  { label: $t('app.success'), value: 'success' },
  { label: $t('app.failed'), value: 'fail' },
]));

const statusMap = computed<Record<string, { color: string; text: string }>>(() => ({
  0: { color: 'red', text: $t('app.failed') },
  1: { color: 'green', text: $t('app.success') },
  fail: { color: 'red', text: $t('app.failed') },
  failed: { color: 'red', text: $t('app.failed') },
  success: { color: 'green', text: $t('app.success') },
}));

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
    statusMap.value[String(status)] ?? { color: 'default', text: String(status) }
  );
}

onMounted(() => {
  queryLogs();
});
</script>

<template>
  <Page :title="$t('app.loginLogs')">
    <Form class="mb-4" layout="inline">
      <Form.Item :label="$t('app.loginAccount')">
        <Input
          v-model:value="filters.account"
          allow-clear
          :placeholder="$t('app.enterAnAccount')"
        />
      </Form.Item>
      <Form.Item :label="$t('app.ipAddress')">
        <Input v-model:value="filters.ip" allow-clear :placeholder="$t('app.enterAnIpAddress')" />
      </Form.Item>
      <Form.Item :label="$t('app.loginStatus')">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="log-filter-select"
          :placeholder="$t('app.selectAnOption')"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button :loading="queryLoading" type="primary" @click="handleSearch">{{ $t('app.search') }}</Button>
          <Button @click="resetFilters">{{ $t('app.reset') }}</Button>
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
