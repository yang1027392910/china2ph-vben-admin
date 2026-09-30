<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';

import { computed, onMounted, ref } from 'vue';

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

import {
  createAdminUserApi,
  deleteAdminUserApi,
  getAdminUserListApi,
} from '#/api';
import { $t } from '#/locales';

type User = {
  canLottery: boolean;
  email: string;
  id: number | string;
  inviteCode: string;
  inviteCount: number;
  ipLocation: string;
  name: string;
  nickname: string;
  role: string;
};

type UserForm = Omit<User, 'id' | 'ipLocation'>;

const defaultForm: UserForm = {
  canLottery: false,
  email: '',
  inviteCode: '',
  inviteCount: 0,
  name: '',
  nickname: '',
  role: '',
};

const defaultQuery = {
  page: 1,
  pageSize: 10,
  username: '',
};

const users = ref<User[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<UserForm>({ ...defaultForm });

const columns = computed<TableColumnsType<User>>(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: $t('app.nickname'), dataIndex: 'nickname', key: 'nickname' },
  { title: $t('app.email'), dataIndex: 'email', key: 'email' },
  { title: $t('app.ipLocation'), dataIndex: 'ipLocation', key: 'ipLocation' },
  { title: $t('app.invitationCode'), dataIndex: 'inviteCode', key: 'inviteCode' },
  { title: $t('app.invitedUsers'), dataIndex: 'inviteCount', key: 'inviteCount' },
  { title: $t('app.eligibleForLuckyDraw'), dataIndex: 'canLottery', key: 'canLottery' },
  { title: $t('app.roles'), dataIndex: 'role', key: 'role' },
  { title: $t('app.actions'), key: 'actions' },
]));

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
    ipLocation: String(item.ipLocation ?? item.ip_location ?? ''),
    name: String(item.name ?? item.realName ?? item.username ?? ''),
    nickname: String(item.nickname ?? item.nickName ?? item.nick_name ?? ''),
    role: String(item.role ?? item.roleName ?? item.roles?.[0] ?? ''),
  }));
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1';
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function buildUserListParams() {
  const username = queryForm.value.username.trim();

  return {
    page: queryForm.value.page,
    pageSize: queryForm.value.pageSize,
    ...(username ? { username } : {}),
  };
}

async function queryUsers(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getAdminUserListApi(buildUserListParams());
    users.value = normalizeUsers(responseData);
    total.value = normalizeTotal(responseData, users.value.length);
  } catch (error: any) {
    message.error(error?.message || $t('app.queryFailed'));
  } finally {
    queryLoading.value = false;
  }
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  queryUsers(queryForm.value.page);
}

function handleQuery() {
  queryUsers(1);
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
    message.error($t('app.enterAName'));
    return;
  }

  if (!payload.email) {
    message.error($t('app.enterAnEmailAddress'));
    return;
  }

  try {
    createLoading.value = true;
    await createAdminUserApi(payload);
    createVisible.value = false;
    message.success($t('app.createdSuccessfully'));
    await queryUsers();
  } catch (error: any) {
    message.error(error?.message || $t('app.creationFailed'));
  } finally {
    createLoading.value = false;
  }
}

async function remove(id: number | string) {
  try {
    await deleteAdminUserApi(id);
    message.success($t('app.deleted'));

    const targetPage =
      users.value.length === 1 && queryForm.value.page > 1
        ? queryForm.value.page - 1
        : queryForm.value.page;
    await queryUsers(targetPage);
  } catch (error: any) {
    message.error(error?.message || $t('app.deletionFailed'));
  }
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
  <Page :title="$t('app.userManagement')" :description="$t('app.userList')">
    <div class="mb-4 flex flex-wrap gap-2">
      <Input
        v-model:value="queryForm.username"
        allow-clear
        class="w-60"
        :placeholder="$t('app.enterAUsername')"
        @press-enter="handleQuery"
      />
      <Button :loading="queryLoading" @click="handleQuery">{{ $t('app.search') }}</Button>
      <Button type="primary" @click="openCreate">{{ $t('app.createUser') }}</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="users"
      :loading="queryLoading"
      :pagination="{
        current: queryForm.page,
        pageSize: queryForm.pageSize,
        showSizeChanger: true,
        total,
      }"
      :scroll="{ x: 1260 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <Popconfirm :title="$t('app.deleteThisItem2')" @confirm="() => remove(record.id)">
              <a>{{ $t('app.delete') }}</a>
            </Popconfirm>
          </Space>
        </template>
        <template v-else-if="column.key === 'canLottery'">
          <Tag :color="record.canLottery ? 'green' : 'default'">
            {{ record.canLottery ? $t('app.yes') : $t('app.no') }}
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
      :title="$t('app.createUser')"
      @ok="createUser"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('app.name')" required>
          <Input v-model:value="createForm.name" />
        </Form.Item>
        <Form.Item :label="$t('app.email')" required>
          <Input v-model:value="createForm.email" />
        </Form.Item>
        <Form.Item :label="$t('app.roles')">
          <Input v-model:value="createForm.role" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
