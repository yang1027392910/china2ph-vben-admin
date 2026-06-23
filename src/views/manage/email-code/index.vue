<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

import { getEmailCodeLogListApi } from '#/api';

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

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 220 },
  { title: '验证码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '业务场景', dataIndex: 'scene', key: 'scene', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '发送状态', dataIndex: 'sendStatus', key: 'sendStatus', width: 120 },
  { title: '过期时间', dataIndex: 'expireTime', key: 'expireTime', width: 180 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
];

const sceneOptions = [
  { label: '登录验证', value: 'login' },
  { label: '修改密码', value: 'password' },
  { label: '绑定邮箱', value: 'bind_email' },
];

const statusOptions = [
  { label: '有效', value: 0 },
  { label: '已使用', value: 1 },
  { label: '已过期', value: 2 },
];

const statusMap: Record<string, { color: string; text: string }> = {
  0: { color: 'green', text: '有效' },
  1: { color: 'blue', text: '已使用' },
  2: { color: 'default', text: '已过期' },
  expired: { color: 'default', text: '已过期' },
  used: { color: 'blue', text: '已使用' },
  valid: { color: 'green', text: '有效' },
};

const sendStatusMap: Record<string, { color: string; text: string }> = {
  0: { color: 'default', text: '待发送' },
  1: { color: 'green', text: '成功' },
  2: { color: 'red', text: '失败' },
  failed: { color: 'red', text: '失败' },
  pending: { color: 'default', text: '待发送' },
  success: { color: 'green', text: '成功' },
};

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
    statusMap[String(status)] ?? { color: 'default', text: String(status) }
  );
}

function getSendStatusMeta(status: number | string) {
  return (
    sendStatusMap[String(status)] ?? { color: 'default', text: String(status) }
  );
}

onMounted(() => {
  queryRecords();
});
</script>

<template>
  <Page title="邮箱验证码记录">
    <Form class="mb-4" layout="inline">
      <Form.Item label="邮箱">
        <Input
          v-model:value="filters.email"
          allow-clear
          placeholder="请输入邮箱"
        />
      </Form.Item>
      <Form.Item label="业务场景">
        <Select
          v-model:value="filters.scene"
          :options="sceneOptions"
          allow-clear
          class="record-filter-select"
          placeholder="请选择"
        />
      </Form.Item>
      <Form.Item label="状态">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="record-filter-select"
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
