<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Form, Input, Select, Space, Table, Tag } from 'ant-design-vue';

type LoginLog = {
  account: string;
  browser: string;
  city: string;
  device: string;
  id: number;
  ip: string;
  loginAt: string;
  message: string;
  os: string;
  status: 'fail' | 'success';
};

const filters = reactive({
  account: '',
  ip: '',
  status: undefined as LoginLog['status'] | undefined,
});

const logs = ref<LoginLog[]>([
  {
    account: 'admin',
    browser: 'Chrome 125',
    city: '上海',
    device: 'Desktop',
    id: 20_001,
    ip: '192.168.1.18',
    loginAt: '2026-06-10 09:13:06',
    message: '登录成功',
    os: 'Windows 11',
    status: 'success',
  },
  {
    account: 'operator',
    browser: 'Edge 125',
    city: '杭州',
    device: 'Desktop',
    id: 20_002,
    ip: '192.168.1.30',
    loginAt: '2026-06-10 10:22:44',
    message: '密码错误',
    os: 'Windows 10',
    status: 'fail',
  },
  {
    account: 'finance',
    browser: 'Safari 17',
    city: '广州',
    device: 'Mobile',
    id: 20_003,
    ip: '10.0.2.15',
    loginAt: '2026-06-09 18:05:09',
    message: '登录成功',
    os: 'iOS 17',
    status: 'success',
  },
]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '登录账号', dataIndex: 'account', key: 'account', width: 140 },
  { title: '登录状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '提示信息', dataIndex: 'message', key: 'message', width: 140 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 140 },
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

const statusMap = {
  fail: { color: 'red', text: '失败' },
  success: { color: 'green', text: '成功' },
};

const filteredLogs = computed(() =>
  logs.value.filter((item) => {
    const matchAccount =
      !filters.account ||
      item.account.toLowerCase().includes(filters.account.trim().toLowerCase());
    const matchIp = !filters.ip || item.ip.includes(filters.ip.trim());
    const matchStatus = !filters.status || item.status === filters.status;

    return matchAccount && matchIp && matchStatus;
  }),
);

function resetFilters() {
  filters.account = '';
  filters.ip = '';
  filters.status = undefined;
}

function getStatusMeta(status: LoginLog['status']) {
  return statusMap[status];
}
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
          <Button type="primary">查询</Button>
          <Button @click="resetFilters">重置</Button>
        </Space>
      </Form.Item>
    </Form>

    <Table
      :columns="columns"
      :data-source="filteredLogs"
      :scroll="{ x: 1360 }"
      row-key="id"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusMeta(record.status).color">
            {{ getStatusMeta(record.status).text }}
          </Tag>
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof LoginLog] }}
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
