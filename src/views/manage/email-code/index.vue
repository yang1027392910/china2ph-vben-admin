<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

type EmailCodeRecord = {
  code: string;
  createdAt: string;
  email: string;
  expiredAt: string;
  id: number;
  ip: string;
  scene: string;
  status: 'expired' | 'used' | 'valid';
  usedAt: string;
};

const filters = reactive({
  email: '',
  scene: undefined as string | undefined,
  status: undefined as EmailCodeRecord['status'] | undefined,
});

const records = ref<EmailCodeRecord[]>([
  {
    code: '839214',
    createdAt: '2026-06-10 09:12:25',
    email: 'admin@example.com',
    expiredAt: '2026-06-10 09:17:25',
    id: 10_001,
    ip: '192.168.1.18',
    scene: '登录验证',
    status: 'used',
    usedAt: '2026-06-10 09:13:02',
  },
  {
    code: '472905',
    createdAt: '2026-06-10 10:36:41',
    email: 'user01@example.com',
    expiredAt: '2026-06-10 10:41:41',
    id: 10_002,
    ip: '192.168.1.26',
    scene: '修改密码',
    status: 'valid',
    usedAt: '',
  },
  {
    code: '615380',
    createdAt: '2026-06-09 18:04:11',
    email: 'finance@example.com',
    expiredAt: '2026-06-09 18:09:11',
    id: 10_003,
    ip: '10.0.2.15',
    scene: '绑定邮箱',
    status: 'expired',
    usedAt: '',
  },
]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '验证码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '业务场景', dataIndex: 'scene', key: 'scene', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 140 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '过期时间', dataIndex: 'expiredAt', key: 'expiredAt', width: 180 },
  { title: '使用时间', dataIndex: 'usedAt', key: 'usedAt', width: 180 },
];

const sceneOptions = [
  { label: '登录验证', value: '登录验证' },
  { label: '修改密码', value: '修改密码' },
  { label: '绑定邮箱', value: '绑定邮箱' },
];

const statusOptions = [
  { label: '有效', value: 'valid' },
  { label: '已使用', value: 'used' },
  { label: '已过期', value: 'expired' },
];

const statusMap = {
  expired: { color: 'default', text: '已过期' },
  used: { color: 'blue', text: '已使用' },
  valid: { color: 'green', text: '有效' },
};

const filteredRecords = computed(() =>
  records.value.filter((item) => {
    const matchEmail =
      !filters.email ||
      item.email.toLowerCase().includes(filters.email.trim().toLowerCase());
    const matchScene = !filters.scene || item.scene === filters.scene;
    const matchStatus = !filters.status || item.status === filters.status;

    return matchEmail && matchScene && matchStatus;
  }),
);

function resetFilters() {
  filters.email = '';
  filters.scene = undefined;
  filters.status = undefined;
}

function getStatusMeta(status: EmailCodeRecord['status']) {
  return statusMap[status];
}
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
          <Button type="primary">查询</Button>
          <Button @click="resetFilters">重置</Button>
        </Space>
      </Form.Item>
    </Form>

    <Table
      :columns="columns"
      :data-source="filteredRecords"
      :scroll="{ x: 1280 }"
      row-key="id"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusMeta(record.status).color">
            {{ getStatusMeta(record.status).text }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'usedAt'">
          {{ record.usedAt || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof EmailCodeRecord] }}
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
