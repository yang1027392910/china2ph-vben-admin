<script lang="ts" setup>
import type { TableProps, UploadProps } from 'ant-design-vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Image as AntImage,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createBannerApi,
  deleteBannerApi,
  getBannerListApi,
  updateBannerApi,
  uploadAdminFileApi,
} from '#/api';

type Banner = {
  actionType: string;
  actionValue: string;
  createdAt?: string;
  endTime: string;
  id: number | string;
  image: string;
  pageType: string;
  sort: number;
  startTime: string;
  status: number;
  subtitle: string;
  title: string;
};

type BannerForm = Omit<Banner, 'createdAt' | 'id'>;

const defaultQuery = {
  keyword: '',
  page: 1,
  pageSize: 10,
  status: '1',
};

const defaultForm: BannerForm = {
  actionType: 'product',
  actionValue: '',
  endTime: '2026-06-30 23:59:59',
  image: '',
  pageType: 'home',
  sort: 1,
  startTime: '2026-06-11 00:00:00',
  status: 1,
  subtitle: '',
  title: '',
};

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

const actionTypeOptions = [
  { label: '商品', value: 'product' },
  { label: '分类', value: 'category' },
  { label: '链接', value: 'url' },
  { label: '无跳转', value: 'none' },
];

const pageTypeOptions = [
  { label: '首页', value: 'home' },
  { label: '客服页', value: 'customer' },
  { label: '登录页', value: 'login' },
];

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: '图片', dataIndex: 'image', key: 'image', width: 120 },
  { title: '页面类型', dataIndex: 'pageType', key: 'pageType', width: 110 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 180 },
  { title: '副标题', dataIndex: 'subtitle', key: 'subtitle', width: 180 },
  { title: '跳转类型', dataIndex: 'actionType', key: 'actionType', width: 110 },
  {
    title: '跳转值',
    dataIndex: 'actionValue',
    key: 'actionValue',
    width: 140,
  },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
  { title: '操作', key: 'actions', width: 100 },
];

const banners = ref<Banner[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<BannerForm>({ ...defaultForm });
const deleteLoadingId = ref<number | string>('');
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<Banner>({
  ...defaultForm,
  createdAt: '',
  id: '',
});
const imageFileList = ref<UploadProps['fileList']>([]);
const editImageFileList = ref<UploadProps['fileList']>([]);

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeBanners(data: any): Banner[] {
  return normalizeList(data).map((item: any) => ({
    actionType: item.actionType ?? '',
    actionValue: item.actionValue ?? '',
    createdAt: item.createdAt ?? '',
    endTime: item.endTime ?? '',
    id: item.id,
    image: item.image ?? '',
    pageType: item.pageType ?? item.scene ?? 'home',
    sort: Number(item.sort ?? 0),
    startTime: item.startTime ?? '',
    status: Number(item.status ?? 0),
    subtitle: item.subtitle ?? '',
    title: item.title ?? '',
  }));
}

function getUploadedImageUrl(data: any) {
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

async function queryBanners(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getBannerListApi({
      keyword: queryForm.value.keyword.trim() || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
      status: queryForm.value.status,
    });

    banners.value = normalizeBanners(responseData);
    total.value = normalizeTotal(responseData, banners.value.length);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

function resetQuery() {
  queryForm.value = { ...defaultQuery };
  queryBanners(1);
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  queryBanners(queryForm.value.page);
}

function openCreate() {
  createForm.value = { ...defaultForm };
  imageFileList.value = [];
  createVisible.value = true;
}

function openEdit(record: Banner) {
  editForm.value = { ...record };
  editImageFileList.value = record.image
    ? [
        {
          name: 'banner',
          status: 'done',
          uid: `${record.id}-banner`,
          url: resolveImageUrl(record.image),
        },
      ]
    : [];
  editVisible.value = true;
}

function beforeImageUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件');
    return false;
  }
  return true;
}

const uploadImage: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    createForm.value.image = imageUrl;
    imageFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}-${file.name}`,
        url: resolveImageUrl(imageUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('图片上传成功');
  } catch (error: any) {
    createForm.value.image = '';
    imageFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadEditImage: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    editForm.value.image = imageUrl;
    editImageFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}-${file.name}`,
        url: resolveImageUrl(imageUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('图片上传成功');
  } catch (error: any) {
    editForm.value.image = '';
    editImageFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

function removeImage() {
  createForm.value.image = '';
  imageFileList.value = [];
}

function removeEditImage() {
  editForm.value.image = '';
  editImageFileList.value = [];
}

function setStartTime(_value: any, dateString: string | string[]) {
  createForm.value.startTime = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

function setEndTime(_value: any, dateString: string | string[]) {
  createForm.value.endTime = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

function setEditStartTime(_value: any, dateString: string | string[]) {
  editForm.value.startTime = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

function setEditEndTime(_value: any, dateString: string | string[]) {
  editForm.value.endTime = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

function buildBannerPayload(form: BannerForm) {
  return {
    actionType: form.actionType,
    actionValue: form.actionValue.trim(),
    endTime: form.endTime,
    image: form.image.trim(),
    pageType: form.pageType,
    scene: form.pageType,
    sort: Number(form.sort),
    startTime: form.startTime,
    status: Number(form.status),
    subtitle: form.subtitle.trim(),
    title: form.title.trim(),
  };
}

function validateBannerPayload(payload: ReturnType<typeof buildBannerPayload>) {
  if (!payload.title) {
    message.error('请输入标题');
    return false;
  }

  if (!payload.image) {
    message.error('请上传图片');
    return false;
  }

  if (!payload.startTime || !payload.endTime) {
    message.error('请选择展示时间');
    return false;
  }

  return true;
}

async function createBanner() {
  const payload = buildBannerPayload(createForm.value);

  if (!validateBannerPayload(payload)) {
    return;
  }

  try {
    createLoading.value = true;
    await createBannerApi(payload);
    createVisible.value = false;
    message.success('新增成功');
    queryBanners(1);
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

async function updateBanner() {
  const payload = buildBannerPayload(editForm.value);

  if (!validateBannerPayload(payload)) {
    return;
  }

  try {
    editLoading.value = true;
    await updateBannerApi({
      ...payload,
      id: editForm.value.id,
    });
    editVisible.value = false;
    message.success('更新成功');
    queryBanners(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
}

async function removeBanner(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteBannerApi({ id });
    banners.value = banners.value.filter((item) => item.id !== id);
    total.value = Math.max(total.value - 1, 0);
    message.success('删除成功');
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  queryBanners();
});
</script>

<template>
  <Page title="Banner 管理">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item label="关键词">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            placeholder="标题/副标题"
            style="width: 200px"
            @press-enter="queryBanners(1)"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="queryForm.status"
            :options="statusOptions"
            style="width: 100px"
          />
        </Form.Item>
      </Form>
      <Space>
        <Button :loading="queryLoading" @click="queryBanners(1)">查询</Button>
        <Button @click="resetQuery">重置</Button>
        <Button type="primary" @click="openCreate">新增 Banner</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="banners"
      :loading="queryLoading"
      :pagination="{
        current: queryForm.page,
        pageSize: queryForm.pageSize,
        showSizeChanger: true,
        showTotal: (count: number) => `共 ${count} 条`,
        total,
      }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <Button
              size="small"
              type="link"
              @click="openEdit(record as Banner)"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除？"
              @confirm="() => removeBanner(record.id)"
            >
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
        <template v-else-if="column.key === 'image'">
          <AntImage
            v-if="record.image"
            :height="48"
            :src="resolveImageUrl(record.image)"
            :width="96"
            class="banner-image"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </template>
        <template v-else-if="column.key === 'pageType'">
          {{ record.pageType === 'customer' ? '客服页' : '首页' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof Banner] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增 Banner"
      width="720px"
      @ok="createBanner"
    >
      <Form layout="vertical">
        <div class="banner-form-grid">
          <Form.Item label="标题" required>
            <Input v-model:value="createForm.title" placeholder="首页大促" />
          </Form.Item>
          <Form.Item label="副标题">
            <Input v-model:value="createForm.subtitle" placeholder="限时优惠" />
          </Form.Item>
          <Form.Item class="banner-form-full" label="图片" required>
            <Upload
              v-model:file-list="imageFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadImage"
              :max-count="1"
              @remove="removeImage"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="跳转类型">
            <Select
              v-model:value="createForm.actionType"
              :options="actionTypeOptions"
            />
          </Form.Item>
          <Form.Item label="页面类型">
            <Select
              v-model:value="createForm.pageType"
              :options="pageTypeOptions"
            />
          </Form.Item>
          <Form.Item label="跳转值">
            <Input v-model:value="createForm.actionValue" placeholder="1001" />
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
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item label="开始时间" required>
            <DatePicker
              :show-time="{ format: 'HH:mm:ss' }"
              :value="dayjs(createForm.startTime, dateTimeFormat)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="setStartTime"
            />
          </Form.Item>
          <Form.Item label="结束时间" required>
            <DatePicker
              :show-time="{ format: 'HH:mm:ss' }"
              :value="dayjs(createForm.endTime, dateTimeFormat)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="setEndTime"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      title="编辑 Banner"
      width="720px"
      @ok="updateBanner"
    >
      <Form layout="vertical">
        <div class="banner-form-grid">
          <Form.Item label="标题" required>
            <Input v-model:value="editForm.title" placeholder="首页大促" />
          </Form.Item>
          <Form.Item label="副标题">
            <Input v-model:value="editForm.subtitle" placeholder="限时优惠" />
          </Form.Item>
          <Form.Item class="banner-form-full" label="图片" required>
            <Upload
              v-model:file-list="editImageFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadEditImage"
              :max-count="1"
              @remove="removeEditImage"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="跳转类型">
            <Select
              v-model:value="editForm.actionType"
              :options="actionTypeOptions"
            />
          </Form.Item>
          <Form.Item label="页面类型">
            <Select
              v-model:value="editForm.pageType"
              :disabled="true"
              :options="pageTypeOptions"
            />
          </Form.Item>
          <Form.Item label="跳转值">
            <Input v-model:value="editForm.actionValue" placeholder="1001" />
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
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item label="开始时间" required>
            <DatePicker
              :show-time="{ format: 'HH:mm:ss' }"
              :value="dayjs(editForm.startTime, dateTimeFormat)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="setEditStartTime"
            />
          </Form.Item>
          <Form.Item label="结束时间" required>
            <DatePicker
              :show-time="{ format: 'HH:mm:ss' }"
              :value="dayjs(editForm.endTime, dateTimeFormat)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="setEditEndTime"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.banner-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.banner-form-full {
  grid-column: 1 / -1;
}

.banner-image {
  object-fit: cover;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .banner-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
