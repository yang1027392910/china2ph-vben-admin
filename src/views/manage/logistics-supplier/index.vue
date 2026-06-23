<script lang="ts" setup>
import type { TableProps, UploadProps } from 'ant-design-vue';

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
  Select,
  Space,
  Switch,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  createLogisticsSupplierApi,
  deleteLogisticsSupplierApi,
  getLogisticsSupplierListApi,
  updateLogisticsSupplierApi,
  uploadAdminFileApi,
} from '#/api';

type LogisticsSupplier = {
  createdAt?: string;
  deliveryTime: string;
  id: number | string;
  logo?: string;
  name: string;
  pricingMethod: string;
  shippingMethod: string;
  sort: number;
  status: number;
  unitPrice: number;
};

type LogisticsSupplierForm = Omit<LogisticsSupplier, 'createdAt' | 'id'>;

const defaultQuery = {
  keyword: '',
  page: 1,
  pageSize: 10,
  shippingMethod: '',
  status: '1',
};

const defaultForm: LogisticsSupplierForm = {
  deliveryTime: '7-15天',
  logo: '',
  name: '',
  pricingMethod: '按kg',
  shippingMethod: '海运',
  sort: 1,
  status: 1,
  unitPrice: 0,
};

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

const shippingMethodOptions = [
  { label: '海运', value: '海运' },
  { label: '空运', value: '空运' },
  { label: '陆运', value: '陆运' },
  { label: '快递', value: '快递' },
];

const queryShippingMethodOptions = [
  { label: '全部', value: '' },
  { label: '海运', value: '海运' },
  { label: '空运', value: '空运' },
];

const pricingMethodOptions = [
  { label: '按kg', value: '按kg' },
  { label: '按件', value: '按件' },
  { label: '按体积', value: '按体积' },
];

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  { title: 'Logo', dataIndex: 'logo', key: 'logo', width: 90 },
  { title: '供应商名称', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: '运输方式',
    dataIndex: 'shippingMethod',
    key: 'shippingMethod',
    width: 120,
  },
  {
    title: '配送时效',
    dataIndex: 'deliveryTime',
    key: 'deliveryTime',
    width: 130,
  },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100 },
  {
    title: '计价方式',
    dataIndex: 'pricingMethod',
    key: 'pricingMethod',
    width: 120,
  },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 140 },
];

const suppliers = ref<LogisticsSupplier[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<LogisticsSupplierForm>({ ...defaultForm });
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<LogisticsSupplier>({
  ...defaultForm,
  createdAt: '',
  id: '',
});
const deleteLoadingId = ref<number | string>('');
const logoFileList = ref<UploadProps['fileList']>([]);
const editLogoFileList = ref<UploadProps['fileList']>([]);

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeSuppliers(data: any): LogisticsSupplier[] {
  return normalizeList(data).map((item: any) => ({
    createdAt: item.createdAt ?? '',
    deliveryTime: item.deliveryTime ?? '',
    id: item.id,
    logo: item.logo ?? '',
    name: item.name ?? '',
    pricingMethod: item.pricingMethod ?? '',
    shippingMethod: item.shippingMethod ?? '',
    sort: Number(item.sort ?? 0),
    status: Number(item.status ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
  }));
}

async function querySuppliers(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getLogisticsSupplierListApi({
      keyword: queryForm.value.keyword.trim() || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
      shippingMethod: queryForm.value.shippingMethod || undefined,
      status: queryForm.value.status,
    });

    suppliers.value = normalizeSuppliers(responseData);
    total.value = normalizeTotal(responseData, suppliers.value.length);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

function resetQuery() {
  queryForm.value = { ...defaultQuery };
  querySuppliers(1);
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  querySuppliers(queryForm.value.page);
}

function openCreate() {
  createForm.value = { ...defaultForm };
  logoFileList.value = [];
  createVisible.value = true;
}

function openEdit(record: LogisticsSupplier) {
  editForm.value = { ...record };
  editLogoFileList.value = record.logo
    ? [
        {
          name: record.logo.split('/').pop() || 'logo',
          status: 'done',
          uid: `${record.id}-logo`,
          url: resolveImageUrl(record.logo),
        },
      ]
    : [];
  editVisible.value = true;
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

function beforeLogoUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件');
    return false;
  }
  return true;
}

const uploadLogo: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const logoUrl = getUploadedImageUrl(responseData);

    if (!logoUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    createForm.value.logo = logoUrl;
    logoFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}-${file.name}`,
        url: resolveImageUrl(logoUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('Logo 上传成功');
  } catch (error: any) {
    createForm.value.logo = '';
    logoFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadEditLogo: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadAdminFileApi(file);
    const logoUrl = getUploadedImageUrl(responseData);

    if (!logoUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    editForm.value.logo = logoUrl;
    editLogoFileList.value = [
      {
        name: file.name,
        status: 'done',
        uid: `${Date.now()}-${file.name}`,
        url: resolveImageUrl(logoUrl),
      },
    ];
    options.onSuccess?.(responseData);
    message.success('Logo 上传成功');
  } catch (error: any) {
    editForm.value.logo = '';
    editLogoFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

function removeLogo() {
  createForm.value.logo = '';
  logoFileList.value = [];
}

function removeEditLogo() {
  editForm.value.logo = '';
  editLogoFileList.value = [];
}

function buildSupplierPayload(form: LogisticsSupplierForm) {
  return {
    deliveryTime: form.deliveryTime.trim(),
    logo: form.logo?.trim() || '',
    name: form.name.trim(),
    pricingMethod: form.pricingMethod.trim(),
    shippingMethod: form.shippingMethod.trim(),
    sort: Number(form.sort),
    status: Number(form.status),
    unitPrice: Number(form.unitPrice),
  };
}

function validateSupplierPayload(
  payload: ReturnType<typeof buildSupplierPayload>,
) {
  if (!payload.name) {
    message.error('请输入供应商名称');
    return false;
  }

  if (!payload.shippingMethod) {
    message.error('请选择运输方式');
    return false;
  }

  if (!payload.deliveryTime) {
    message.error('请输入配送时效');
    return false;
  }

  if (!payload.pricingMethod) {
    message.error('请选择计价方式');
    return false;
  }

  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
    message.error('请输入正确的单价');
    return false;
  }

  return true;
}

async function createSupplier() {
  const form = createForm.value;
  const payload = {
    deliveryTime: form.deliveryTime.trim(),
    logo: form.logo?.trim() || '',
    name: form.name.trim(),
    pricingMethod: form.pricingMethod.trim(),
    shippingMethod: form.shippingMethod.trim(),
    sort: Number(form.sort),
    status: Number(form.status),
    unitPrice: Number(form.unitPrice),
  };

  if (!payload.name) {
    message.error('请输入供应商名称');
    return;
  }

  if (!payload.shippingMethod) {
    message.error('请选择运输方式');
    return;
  }

  if (!payload.deliveryTime) {
    message.error('请输入配送时效');
    return;
  }

  if (!payload.pricingMethod) {
    message.error('请选择计价方式');
    return;
  }

  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
    message.error('请输入正确的单价');
    return;
  }

  try {
    createLoading.value = true;
    await createLogisticsSupplierApi(payload);
    createVisible.value = false;
    message.success('新增成功');
    querySuppliers(1);
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

async function updateSupplier() {
  const payload = buildSupplierPayload(editForm.value);

  if (!validateSupplierPayload(payload)) {
    return;
  }

  try {
    editLoading.value = true;
    await updateLogisticsSupplierApi({
      ...payload,
      id: editForm.value.id,
    });
    editVisible.value = false;
    message.success('更新成功');
    querySuppliers(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
}

async function removeSupplier(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteLogisticsSupplierApi(id);
    suppliers.value = suppliers.value.filter((item) => item.id !== id);
    total.value = Math.max(total.value - 1, 0);
    message.success('删除成功');
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  querySuppliers();
});
</script>

<template>
  <Page title="物流供应商">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item label="关键词">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            placeholder="供应商名称/运输方式"
            style="width: 200px"
            @press-enter="querySuppliers(1)"
          />
        </Form.Item>
        <Form.Item label="运输方式">
          <Select
            v-model:value="queryForm.shippingMethod"
            :options="queryShippingMethodOptions"
            style="width: 120px"
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
        <Button :loading="queryLoading" @click="querySuppliers(1)">查询</Button>
        <Button @click="resetQuery">重置</Button>
        <Button type="primary" @click="openCreate">新增供应商</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="suppliers"
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
            <a @click="openEdit(record as LogisticsSupplier)">编辑</a>
            <Popconfirm
              title="确定删除？"
              @confirm="() => removeSupplier(record.id)"
            >
              <a>
                {{ deleteLoadingId === record.id ? '删除中' : '删除' }}
              </a>
            </Popconfirm>
          </Space>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </template>
        <template v-else-if="column.key === 'logo'">
          <AntImage
            v-if="record.logo"
            :height="40"
            :src="resolveImageUrl(record.logo)"
            :width="40"
            class="supplier-logo"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'unitPrice'">
          {{ Number(record.unitPrice).toFixed(2) }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof LogisticsSupplier] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增物流供应商"
      width="620px"
      @ok="createSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" label="供应商名称" required>
            <Input v-model:value="createForm.name" placeholder="顺丰海运" />
          </Form.Item>
          <Form.Item class="supplier-form-full" label="Logo">
            <Upload
              v-model:file-list="logoFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadLogo"
              :max-count="1"
              @remove="removeLogo"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="运输方式" required>
            <Select
              v-model:value="createForm.shippingMethod"
              :options="shippingMethodOptions"
            />
          </Form.Item>
          <Form.Item label="配送时效" required>
            <Input
              v-model:value="createForm.deliveryTime"
              placeholder="7-15天"
            />
          </Form.Item>
          <Form.Item label="单价" required>
            <InputNumber
              v-model:value="createForm.unitPrice"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="计价方式" required>
            <Select
              v-model:value="createForm.pricingMethod"
              :options="pricingMethodOptions"
            />
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
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      title="编辑物流供应商"
      width="620px"
      @ok="updateSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" label="供应商名称" required>
            <Input v-model:value="editForm.name" placeholder="顺丰海运" />
          </Form.Item>
          <Form.Item class="supplier-form-full" label="Logo">
            <Upload
              v-model:file-list="editLogoFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadEditLogo"
              :max-count="1"
              @remove="removeEditLogo"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="运输方式" required>
            <Select
              v-model:value="editForm.shippingMethod"
              :options="shippingMethodOptions"
            />
          </Form.Item>
          <Form.Item label="配送时效" required>
            <Input v-model:value="editForm.deliveryTime" placeholder="7-15天" />
          </Form.Item>
          <Form.Item label="单价" required>
            <InputNumber
              v-model:value="editForm.unitPrice"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="计价方式" required>
            <Select
              v-model:value="editForm.pricingMethod"
              :options="pricingMethodOptions"
            />
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
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.supplier-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.supplier-form-full {
  grid-column: 1 / -1;
}

.supplier-logo {
  object-fit: cover;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .supplier-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
