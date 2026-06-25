<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { createAdminUserApi, getAdminUserListApi } from '#/api';

type User = {
  canLottery: boolean;
  email: string;
  id: number | string;
  inviteCode: string;
  inviteCount: number;
  name: string;
  nickname: string;
  role: string;
};

type UserForm = Omit<User, 'id'>;

const defaultForm: UserForm = {
  canLottery: false,
  email: '',
  inviteCode: '',
  inviteCount: 0,
  name: '',
  nickname: '',
  role: '',
};

const users = ref<User[]>([]);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<UserForm>({ ...defaultForm });

const columns: TableColumnsType<User> = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '邀请码', dataIndex: 'inviteCode', key: 'inviteCode' },
  { title: '邀请人数', dataIndex: 'inviteCount', key: 'inviteCount' },
  { title: '可抽奖', dataIndex: 'canLottery', key: 'canLottery' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '操作', key: 'actions' },
];

function normalizeUsers(data: any): User[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => ({
    canLottery: normalizeBoolean(item.canLottery ?? item.can_lottery),
    email: String(item.email ?? ''),
    id: item.id ?? item.userId ?? '',
    inviteCode: String(item.inviteCode ?? item.invite_code ?? ''),
    inviteCount: Number(item.inviteCount ?? item.invite_count ?? 0),
    name: String(item.name ?? item.realName ?? item.username ?? ''),
    nickname: String(item.nickname ?? item.nickName ?? item.nick_name ?? ''),
    role: String(item.role ?? item.roleName ?? item.roles?.[0] ?? ''),
  }));
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1';
}

async function queryUsers() {
  try {
    queryLoading.value = true;
    const responseData = await getAdminUserListApi();
    users.value = normalizeUsers(responseData);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

function openCreate() {
  createForm.value = { ...defaultForm };
  createVisible.value = true;
}

async function createUser() {
  const payload = {
    email: createForm.value.email.trim(),
    name: createForm.value.name.trim(),
    role: createForm.value.role.trim(),
  };

  if (!payload.name) {
    message.error('请输入姓名');
    return;
  }

  if (!payload.email) {
    message.error('请输入邮箱');
    return;
  }

  try {
    createLoading.value = true;
    await createAdminUserApi(payload);
    createVisible.value = false;
    message.success('新增成功');
    await queryUsers();
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

function remove(id: number | string) {
  users.value = users.value.filter((item) => item.id !== id);
  message.success('已删除');
}

function getCellValue(record: Record<string, any>, dataIndex: unknown) {
  return typeof dataIndex === 'string' ? record[dataIndex] : '';
}

function formatCellValue(value: unknown) {
  return value === undefined || value === null || value === '' ? '-' : value;
}

onMounted(() => {
  queryUsers();
});
</script>

<template>
  <Page title="用户管理" description="用户列表">
    <div class="mb-4 flex gap-2">
      <Button :loading="queryLoading" @click="queryUsers">查询</Button>
      <Button type="primary" @click="openCreate">新建用户</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="users"
      :loading="queryLoading"
      :scroll="{ x: 1100 }"
      row-key="id"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <Popconfirm title="确定删除?" @confirm="() => remove(record.id)">
              <a>删除</a>
            </Popconfirm>
          </Space>
        </template>
        <template v-else-if="column.key === 'canLottery'">
          <Tag :color="record.canLottery ? 'green' : 'default'">
            {{ record.canLottery ? '是' : '否' }}
          </Tag>
        </template>
        <template v-else>
          {{ formatCellValue(getCellValue(record, column.dataIndex)) }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新建用户"
      @ok="createUser"
    >
      <Form layout="vertical">
        <Form.Item label="姓名" required>
          <Input v-model:value="createForm.name" />
        </Form.Item>
        <Form.Item label="邮箱" required>
          <Input v-model:value="createForm.email" />
        </Form.Item>
        <Form.Item label="角色">
          <Input v-model:value="createForm.role" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
