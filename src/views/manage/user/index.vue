<script lang="ts" setup>
import { ref } from 'vue';

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
} from 'ant-design-vue';

type User = { email: string; id: number; name: string; role: string };

const users = ref<User[]>([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑' },
]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '操作', key: 'actions' },
];

const modalVisible = ref(false);
const editForm = ref({ id: 0, name: '', email: '', role: '' });
const formRef = ref();

function add() {
  editForm.value = { id: 0, name: '', email: '', role: '' };
  modalVisible.value = true;
}

function edit(row: User) {
  editForm.value = { ...row };
  modalVisible.value = true;
}

function save() {
  const f = editForm.value;
  if (!f.name) {
    message.error('请输入姓名');
    return;
  }
  if (f.id === 0) {
    f.id = Date.now();
    users.value.push({ ...f });
    message.success('新增成功');
  } else {
    const idx = users.value.findIndex((i) => i.id === f.id);
    if (idx !== -1) users.value[idx] = { ...f };
    message.success('更新成功');
  }
  modalVisible.value = false;
}

function remove(id: number) {
  users.value = users.value.filter((i) => i.id !== id);
  message.success('已删除');
}
</script>

<template>
  <Page title="用户管理" description="增删改查示例页面">
    <div class="mb-4">
      <Button type="primary" @click="add">新建用户</Button>
    </div>
    <Table :columns="columns" :data-source="users" row-key="id">
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="edit(record)">编辑</a>
            <Popconfirm title="确定删除?" @confirm="() => remove(record.id)">
              <a>删除</a>
            </Popconfirm>
          </Space>
        </template>
        <template v-else>
          {{ record[column.dataIndex] }}
        </template>
      </template>
    </Table>
    <Modal v-model:visible="modalVisible" title="用户" @ok="save">
      <Form ref="formRef" layout="vertical">
        <Form.Item label="姓名">
          <Input v-model:value="editForm.name" />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input v-model:value="editForm.email" />
        </Form.Item>
        <Form.Item label="角色">
          <Input v-model:value="editForm.role" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
