<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Image as AntImage,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
  uploadAdminFileApi,
} from '#/api';

type Category = {
  alice?: string;
  icon?: string;
  id: number | string;
  name: string;
  sort: number;
  status: string;
};

type CategoryForm = {
  alice: string;
  icon: string;
  name: string;
  sort: number;
  status: string;
};

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

const categories = ref<Category[]>([
  { id: 1, name: '电子产品', sort: 1, status: '1' },
  { id: 2, name: '手机', sort: 2, status: '1' },
]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Icon', dataIndex: 'icon', key: 'icon' },
  { title: '分类名称', dataIndex: 'name', key: 'name' },
  { title: '别名', dataIndex: 'alice', key: 'alice' },
  { title: '排序', dataIndex: 'sort', key: 'sort' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'actions' },
];

const queryLoading = ref(false);
const deleteLoadingId = ref<number | string>('');
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<CategoryForm>({
  alice: '',
  icon: '',
  name: '',
  sort: 1,
  status: '1',
});
const iconFileList = ref<UploadProps['fileList']>([]);

const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<Category>({
  alice: '',
  icon: '',
  id: '',
  name: '',
  sort: 1,
  status: '1',
});
const editIconFileList = ref<UploadProps['fileList']>([]);

function normalizeCategories(data: any): Category[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => ({
    alice: item.alice ?? '',
    icon: item.icon ?? '',
    id: item.id,
    name: item.name,
    sort: Number(item.sort ?? 0),
    status: item.status ?? '1',
  }));
}

function getUploadedIconUrl(data: any) {
  if (typeof data === 'string') {
    return data;
  }

  return (
    data?.url ||
    data?.path ||
    data?.fileUrl ||
    data?.filePath ||
    data?.src ||
    data?.data?.url ||
    data?.data?.path ||
    ''
  );
}

function resolveImageUrl(url?: string) {
  if (!url) {
    return '';
  }

  if (/^(blob:|data:|https?:\/\/)/.test(url)) {
    return url;
  }

  if (url.startsWith('/uploads')) {
    return `${uploadOrigin}${url}`;
  }

  return url.startsWith('/') ? url : `/${url}`;
}

async function queryCategories() {
  try {
    queryLoading.value = true;
    const responseData = await getCategoryListApi({ status: '1' });
    categories.value = normalizeCategories(responseData);
    message.success('查询成功');
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

function openCreate() {
  createForm.value = {
    alice: '',
    icon: '',
    name: '',
    sort: 1,
    status: '1',
  };
  iconFileList.value = [];
  createVisible.value = true;
}

function buildIconFileList(icon?: string, uidPrefix: number | string = 'icon') {
  return icon
    ? [
        {
          name: icon.split('/').pop() || 'icon',
          status: 'done' as const,
          uid: `${uidPrefix}-icon`,
          url: resolveImageUrl(icon),
        },
      ]
    : [];
}

function edit(row: Category) {
  editForm.value = { ...row };
  editIconFileList.value = buildIconFileList(row.icon, row.id);
  editVisible.value = true;
}

async function createCategory() {
  const payload = {
    alice: createForm.value.alice.trim(),
    icon: createForm.value.icon,
    name: createForm.value.name.trim(),
    sort: Number(createForm.value.sort),
    status: createForm.value.status,
  };

  if (!payload.name) {
    message.error('请输入分类名称');
    return;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error('请输入正确的排序');
    return;
  }

  try {
    createLoading.value = true;
    const createdCategory = (await createCategoryApi(payload)) as
      | Category
      | undefined;

    categories.value.unshift({
      alice: createdCategory?.alice ?? payload.alice,
      icon: createdCategory?.icon || payload.icon,
      id: createdCategory?.id || Date.now(),
      name: createdCategory?.name || payload.name,
      sort: Number(createdCategory?.sort ?? payload.sort),
      status: createdCategory?.status || payload.status,
    });
    createVisible.value = false;
    message.success('新增成功');
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

function beforeIconUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件');
    return false;
  }
  return true;
}

const uploadIcon: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const iconUrl = getUploadedIconUrl(responseData);

    if (!iconUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    createForm.value.icon = iconUrl;
    iconFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}`,
        url: resolveImageUrl(iconUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('上传成功');
  } catch (error: any) {
    createForm.value.icon = '';
    iconFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadEditIcon: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const iconUrl = getUploadedIconUrl(responseData);

    if (!iconUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    editForm.value.icon = iconUrl;
    editIconFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}`,
        url: resolveImageUrl(iconUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('上传成功');
  } catch (error: any) {
    editForm.value.icon = '';
    editIconFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

function removeIcon() {
  createForm.value.icon = '';
  iconFileList.value = [];
}

function removeEditIcon() {
  editForm.value.icon = '';
  editIconFileList.value = [];
}

async function saveEdit() {
  const f = editForm.value;

  const payload = {
    alice: f.alice?.trim() || '',
    icon: f.icon || '',
    id: f.id,
    name: f.name.trim(),
    sort: Number(f.sort),
  };

  if (!payload.name) {
    message.error('请输入分类名称');
    return;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error('请输入正确的排序');
    return;
  }

  try {
    editLoading.value = true;
    const updatedCategory = (await updateCategoryApi(payload)) as
      | Category
      | undefined;
    const nextCategory = {
      ...f,
      alice: updatedCategory?.alice ?? payload.alice,
      icon: updatedCategory?.icon ?? payload.icon,
      name: updatedCategory?.name ?? payload.name,
      sort: Number(updatedCategory?.sort ?? payload.sort),
    };
    const idx = categories.value.findIndex((i) => i.id === f.id);
    if (idx !== -1) {
      categories.value[idx] = nextCategory;
    }
    editVisible.value = false;
    message.success('更新成功');
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
}

async function remove(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteCategoryApi(id);
    categories.value = categories.value.filter((i) => i.id !== id);
    message.success('已删除');
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  queryCategories();
});
</script>

<template>
  <Page title="商品分类管理">
    <div class="mb-4 flex gap-2">
      <Button :loading="queryLoading" @click="queryCategories">查询</Button>
      <Button type="primary" @click="openCreate">新增分类</Button>
    </div>

    <Table :columns="columns" :data-source="categories" row-key="id">
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="edit(record as Category)">编辑</a>
            <Popconfirm title="确定删除？" @confirm="() => remove(record.id)">
              <Button
                :loading="deleteLoadingId === record.id"
                danger
                size="small"
                type="link"
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
        <template v-else-if="column.key === 'icon'">
          <AntImage
            v-if="record.icon"
            :height="32"
            :src="resolveImageUrl(record.icon)"
            :width="32"
            class="category-icon"
            @error="message.error('图片加载失败，请确认文件服务可以正常访问')"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === '1' ? '启用' : '禁用' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof Category] }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增分类"
      @ok="createCategory"
    >
      <Form layout="vertical">
        <Form.Item label="分类名称" required>
          <Input v-model:value="createForm.name" />
        </Form.Item>
        <Form.Item label="别名">
          <Input v-model:value="createForm.alice" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="createForm.sort"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="启用">
          <Switch
            v-model:checked="createForm.status"
            checked-value="1"
            un-checked-value="0"
          />
        </Form.Item>
        <Form.Item label="Icon">
          <Upload
            v-model:file-list="iconFileList"
            :before-upload="beforeIconUpload"
            :custom-request="uploadIcon"
            :max-count="1"
            @remove="removeIcon"
            accept="image/*"
            list-type="picture-card"
          >
            <div>上传</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="editVisible" title="编辑分类" @ok="saveEdit">
      <Form layout="vertical">
        <Form.Item label="ID">
          <Input v-model:value="editForm.id" disabled />
        </Form.Item>
        <Form.Item label="分类名称" required>
          <Input v-model:value="editForm.name" />
        </Form.Item>
        <Form.Item label="别名">
          <Input v-model:value="editForm.alice" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="启用">
          <Switch
            v-model:checked="editForm.status"
            checked-value="1"
            disabled
            un-checked-value="0"
          />
        </Form.Item>
        <Form.Item label="Icon">
          <Upload
            v-model:file-list="editIconFileList"
            :before-upload="beforeIconUpload"
            :custom-request="uploadEditIcon"
            :max-count="1"
            @remove="removeEditIcon"
            accept="image/*"
            list-type="picture-card"
          >
            <div>上传</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.category-icon {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
