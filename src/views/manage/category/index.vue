<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { computed, onMounted, ref } from 'vue';

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
import { $t } from '#/locales';

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
  { id: 1, get name() { return $t('app.electronics'); }, sort: 1, status: '1' },
  { id: 2, get name() { return $t('app.mobilePhones'); }, sort: 2, status: '1' },
]);

const columns = computed(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Icon', dataIndex: 'icon', key: 'icon' },
  { title: $t('app.categoryName'), dataIndex: 'name', key: 'name' },
  { title: $t('app.alias'), dataIndex: 'alice', key: 'alice' },
  { title: $t('app.sortOrder'), dataIndex: 'sort', key: 'sort' },
  { title: $t('app.status'), dataIndex: 'status', key: 'status' },
  { title: $t('app.actions'), key: 'actions' },
]));

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
    message.success($t('app.queryCompleted'));
  } catch (error: any) {
    message.error(error?.message || $t('app.queryFailed'));
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
    message.error($t('app.enterACategoryName'));
    return;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error($t('app.enterAValidSortOrder'));
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
    message.success($t('app.createdSuccessfully'));
  } catch (error: any) {
    message.error(error?.message || $t('app.creationFailed'));
  } finally {
    createLoading.value = false;
  }
}

function beforeIconUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error($t('app.selectAnImageFile'));
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
      throw new Error($t('app.theUploadResponseDidNotIncludeAnImageUrl'));
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
    message.success($t('app.uploadedSuccessfully'));
  } catch (error: any) {
    createForm.value.icon = '';
    iconFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || $t('app.uploadFailed'));
  }
};

const uploadEditIcon: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const iconUrl = getUploadedIconUrl(responseData);

    if (!iconUrl) {
      throw new Error($t('app.theUploadResponseDidNotIncludeAnImageUrl'));
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
    message.success($t('app.uploadedSuccessfully'));
  } catch (error: any) {
    editForm.value.icon = '';
    editIconFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || $t('app.uploadFailed'));
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
    message.error($t('app.enterACategoryName'));
    return;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error($t('app.enterAValidSortOrder'));
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
    message.success($t('app.updatedSuccessfully'));
  } catch (error: any) {
    message.error(error?.message || $t('app.updateFailed'));
  } finally {
    editLoading.value = false;
  }
}

async function remove(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteCategoryApi(id);
    categories.value = categories.value.filter((i) => i.id !== id);
    message.success($t('app.deleted'));
  } catch (error: any) {
    message.error(error?.message || $t('app.deletionFailed'));
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  queryCategories();
});
</script>

<template>
  <Page :title="$t('app.productCategories')">
    <div class="mb-4 flex gap-2">
      <Button :loading="queryLoading" @click="queryCategories">{{ $t('app.search') }}</Button>
      <Button type="primary" @click="openCreate">{{ $t('app.addCategory') }}</Button>
    </div>

    <Table :columns="columns" :data-source="categories" row-key="id">
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="edit(record as Category)">{{ $t('app.edit') }}</a>
            <Popconfirm :title="$t('app.deleteThisItem')" @confirm="() => remove(record.id)">
              <Button
                :loading="deleteLoadingId === record.id"
                danger
                size="small"
                type="link"
              >
{{ $t('app.delete') }}
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
            @error="message.error($t('app.imageFailedToLoadCheckThatTheFileServerIs'))"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === '1' ? $t('app.enable') : $t('app.disable') }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof Category] }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      :title="$t('app.addCategory')"
      @ok="createCategory"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('app.categoryName')" required>
          <Input v-model:value="createForm.name" />
        </Form.Item>
        <Form.Item :label="$t('app.alias')">
          <Input v-model:value="createForm.alice" />
        </Form.Item>
        <Form.Item :label="$t('app.sortOrder')">
          <InputNumber
            v-model:value="createForm.sort"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.enable')">
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
            <div>{{ $t('app.upload') }}</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="editVisible" :title="$t('app.editCategory')" @ok="saveEdit">
      <Form layout="vertical">
        <Form.Item label="ID">
          <Input v-model:value="editForm.id" disabled />
        </Form.Item>
        <Form.Item :label="$t('app.categoryName')" required>
          <Input v-model:value="editForm.name" />
        </Form.Item>
        <Form.Item :label="$t('app.alias')">
          <Input v-model:value="editForm.alice" />
        </Form.Item>
        <Form.Item :label="$t('app.sortOrder')">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.enable')">
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
            <div>{{ $t('app.upload') }}</div>
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
