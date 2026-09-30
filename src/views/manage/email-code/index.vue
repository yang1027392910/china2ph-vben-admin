<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

import { getEmailCodeLogListApi } from '#/api';
import { $t } from '#/locales';

type EmailCodeRecord = {
  code: string;
  createdAt: string;
  email: string;
  expireTime: string;
  id: number | string;
  ip: string;
  scene: string;
  sendStatus: number | string;
  status: number | string;
};

const filters = reactive({
  email: '',
  page: 1,
  pageSize: 10,
  scene: undefined as string | undefined,
  status: undefined as number | undefined,
});

const records = ref<EmailCodeRecord[]>([]);
const total = ref(0);
const queryLoading = ref(false);

const columns = computed(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: $t('app.email'), dataIndex: 'email', key: 'email', width: 220 },
  { title: $t('app.verificationCode'), dataIndex: 'code', key: 'code', width: 120 },
  { title: $t('app.purpose'), dataIndex: 'scene', key: 'scene', width: 140 },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 110 },
  { title: $t('app.deliveryStatus'), dataIndex: 'sendStatus', key: 'sendStatus', width: 120 },
  { title: $t('app.expirationTime'), dataIndex: 'expireTime', key: 'expireTime', width: 180 },
  { title: $t('app.ipAddress'), dataIndex: 'ip', key: 'ip', width: 150 },
  { title: $t('app.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
]));

const sceneOptions = computed(() => ([
  { label: $t('app.loginVerification'), value: 'login' },
  { label: $t('app.changePassword'), value: 'password' },
  { label: $t('app.linkEmail'), value: 'bind_email' },
]));

const statusOptions = computed(() => ([
  { label: $t('app.valid'), value: 0 },
  { label: $t('app.used'), value: 1 },
  { label: $t('app.expired'), value: 2 },
]));

const statusMap = computed<Record<string, { color: string; text: string }>>(() => ({
  0: { color: 'green', text: $t('app.valid') },
  1: { color: 'blue', text: $t('app.used') },
  2: { color: 'default', text: $t('app.expired') },
  expired: { color: 'default', text: $t('app.expired') },
  used: { color: 'blue', text: $t('app.used') },
  valid: { color: 'green', text: $t('app.valid') },
}));

const sendStatusMap = computed<Record<string, { color: string; text: string }>>(() => ({
  0: { color: 'default', text: $t('app.pendingDelivery') },
  1: { color: 'green', text: $t('app.success') },
  2: { color: 'red', text: $t('app.failed') },
  failed: { color: 'red', text: $t('app.failed') },
  pending: { color: 'default', text: $t('app.pendingDelivery') },
  success: { color: 'green', text: $t('app.success') },
}));

function normalizeRecords(data: any): EmailCodeRecord[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => ({
    code: String(item.code ?? ''),
    createdAt: String(item.createdAt ?? ''),
    email: String(item.email ?? ''),
    expireTime: String(item.expireTime ?? ''),
    id: item.id ?? '',
    ip: String(item.ip ?? ''),
    scene: String(item.scene ?? ''),
    sendStatus: item.sendStatus ?? '',
    status: item.status ?? '',
  }));
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

async function queryRecords() {
  try {
    queryLoading.value = true;
    const responseData = await getEmailCodeLogListApi({
      email: filters.email.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      scene: filters.scene,
      status: filters.status,
    });
    records.value = normalizeRecords(responseData);
    total.value = normalizeTotal(responseData, records.value.length);
  } finally {
    queryLoading.value = false;
  }
}

function resetFilters() {
  filters.email = '';
  filters.page = 1;
  filters.scene = undefined;
  filters.status = undefined;
  queryRecords();
}

function handleSearch() {
  filters.page = 1;
  queryRecords();
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  filters.page = pagination.current ?? 1;
  filters.pageSize = pagination.pageSize ?? 10;
  queryRecords();
}

function getStatusMeta(status: number | string) {
  return (
    statusMap.value[String(status)] ?? { color: 'default', text: String(status) }
  );
}

function getSendStatusMeta(status: number | string) {
  return (
    sendStatusMap.value[String(status)] ?? { color: 'default', text: String(status) }
  );
}

onMounted(() => {
  queryRecords();
});
</script>

<template>
  <Page :title="$t('app.emailVerificationCodes')">
    <Form class="mb-4" layout="inline">
      <Form.Item :label="$t('app.email')">
        <Input
          v-model:value="filters.email"
          allow-clear
          :placeholder="$t('app.enterAnEmailAddress')"
        />
      </Form.Item>
      <Form.Item :label="$t('app.purpose')">
        <Select
          v-model:value="filters.scene"
          :options="sceneOptions"
          allow-clear
          class="record-filter-select"
          :placeholder="$t('app.selectAnOption')"
        />
      </Form.Item>
      <Form.Item :label="$t('app.status')">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="record-filter-select"
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
      :data-source="records"
      :loading="queryLoading"
      :pagination="{
        current: filters.page,
        pageSize: filters.pageSize,
        showSizeChanger: true,
        total,
      }"
      :scroll="{ x: 1300 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusMeta(record.status).color">
            {{ getStatusMeta(record.status).text }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'sendStatus'">
          <Tag :color="getSendStatusMeta(record.sendStatus).color">
            {{ getSendStatusMeta(record.sendStatus).text }}
          </Tag>
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof EmailCodeRecord] || '-' }}
        </template>
      </template>
    </Table>
  </Page>
</template>

<style scoped>
.record-filter-select {
  width: 160px;
}
</style>
