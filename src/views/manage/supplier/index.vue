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
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  createSupplierApi,
  deleteSupplierApi,
  getSupplierListApi,
  updateSupplierApi,
  uploadAdminFileApi,
} from '#/api';

type Supplier = {
  city: string;
  contact_whatsapp: string;
  createdAt?: string;
  description: string;
  id: number | string;
  images: string[];
  logo: string;
  main_products: string;
  moq: string;
  name: string;
  show_contact: number;
  sort: number;
  status: number;
};

type SupplierForm = Omit<Supplier, 'createdAt' | 'id'>;

const defaultQuery = {
  city: '',
  keyword: '',
  page: 1,
  pageSize: 10,
  status: '',
};

const defaultForm: SupplierForm = {
  city: '',
  contact_whatsapp: '',
  description: '',
  images: [],
  logo: '',
  main_products: '',
  moq: '',
  name: '',
  show_contact: 1,
  sort: 1,
  status: 1,
};

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'Logo', dataIndex: 'logo', key: 'logo', width: 90 },
  { title: '供应商图片', dataIndex: 'images', key: 'images', width: 180 },
  { title: '供应商名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  {
    title: '主营产品',
    dataIndex: 'main_products',
    key: 'main_products',
    width: 180,
  },
  { title: 'MOQ', dataIndex: 'moq', key: 'moq', width: 120 },
  {
    title: 'WhatsApp',
    dataIndex: 'contact_whatsapp',
    key: 'contact_whatsapp',
    width: 150,
  },
  { title: '展示联系', dataIndex: 'show_contact', key: 'show_contact', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' },
];

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

const suppliers = ref<Supplier[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<SupplierForm>({ ...defaultForm });
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<Supplier>({
  ...defaultForm,
  createdAt: '',
  id: '',
});
const deleteLoadingId = ref<number | string>('');
const logoFileList = ref<UploadProps['fileList']>([]);
const editLogoFileList = ref<UploadProps['fileList']>([]);
const imageFileList = ref<UploadProps['fileList']>([]);
const editImageFileList = ref<UploadProps['fileList']>([]);

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeImages(images: any): string[] {
  if (Array.isArray(images)) {
    return images.filter(Boolean).map(String);
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return images
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function buildImageFileList(images: string[], uidPrefix: number | string) {
  return images.map((image, index) => ({
    name: image.split('/').pop() || `image-${index + 1}`,
    status: 'done' as const,
    uid: `${uidPrefix}-image-${index}`,
    url: resolveImageUrl(image),
  }));
}

function normalizeSuppliers(data: any): Supplier[] {
  return normalizeList(data).map((item: any) => ({
    city: item.city ?? '',
    contact_whatsapp: item.contact_whatsapp ?? item.contactWhatsapp ?? '',
    createdAt: item.createdAt ?? item.created_at ?? '',
    description: item.description ?? '',
    id: item.id,
    images: normalizeImages(item.images),
    logo: item.logo ?? '',
    main_products: item.main_products ?? item.mainProducts ?? '',
    moq: item.moq ?? '',
    name: item.name ?? '',
    show_contact: Number(item.show_contact ?? item.showContact ?? 0),
    sort: Number(item.sort ?? 0),
    status: Number(item.status ?? 0),
  }));
}

async function querySuppliers(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getSupplierListApi({
      city: queryForm.value.city.trim() || undefined,
      keyword: queryForm.value.keyword.trim() || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
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
  imageFileList.value = [];
  createVisible.value = true;
}

function openEdit(record: Supplier) {
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
  editImageFileList.value = buildImageFileList(record.images, record.id);
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

function createUploadRequest(
  target: typeof createForm | typeof editForm,
  fileList: typeof logoFileList,
) {
  const uploadRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;

    try {
      const responseData = await uploadAdminFileApi(file);
      const logoUrl = getUploadedImageUrl(responseData);

      if (!logoUrl) {
        throw new Error('上传接口未返回图片地址');
      }

      target.value.logo = logoUrl;
      fileList.value = [
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
      target.value.logo = '';
      fileList.value = [];
      options.onError?.(error);
      message.error(error?.message || '上传失败');
    }
  };

  return uploadRequest;
}

const uploadLogo = createUploadRequest(createForm, logoFileList);
const uploadEditLogo = createUploadRequest(editForm, editLogoFileList);

function createImagesUploadRequest(
  target: typeof createForm | typeof editForm,
  fileList: typeof imageFileList,
) {
  const uploadRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;

    try {
      const responseData = await uploadAdminFileApi(file);
      const imageUrl = getUploadedImageUrl(responseData);

      if (!imageUrl) {
        throw new Error('上传接口未返回图片地址');
      }

      target.value.images = [...target.value.images, imageUrl];
      fileList.value = [
        ...(fileList.value || []),
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
      options.onError?.(error);
      message.error(error?.message || '上传失败');
    }
  };

  return uploadRequest;
}

const uploadImages = createImagesUploadRequest(createForm, imageFileList);
const uploadEditImages = createImagesUploadRequest(
  editForm,
  editImageFileList,
);

function removeLogo() {
  createForm.value.logo = '';
  logoFileList.value = [];
}

function removeEditLogo() {
  editForm.value.logo = '';
  editLogoFileList.value = [];
}

function removeImage(url?: string) {
  if (!url) {
    return;
  }

  createForm.value.images = createForm.value.images.filter(
    (image) => resolveImageUrl(image) !== url && image !== url,
  );
  imageFileList.value = imageFileList.value?.filter((file) => file.url !== url);
}

function removeEditImage(url?: string) {
  if (!url) {
    return;
  }

  editForm.value.images = editForm.value.images.filter(
    (image) => resolveImageUrl(image) !== url && image !== url,
  );
  editImageFileList.value = editImageFileList.value?.filter(
    (file) => file.url !== url,
  );
}

function buildSupplierPayload(form: SupplierForm) {
  return {
    city: form.city.trim(),
    contact_whatsapp: form.contact_whatsapp.trim(),
    description: form.description.trim(),
    images: form.images,
    logo: form.logo.trim(),
    main_products: form.main_products.trim(),
    moq: form.moq.trim(),
    name: form.name.trim(),
    show_contact: Number(form.show_contact),
    sort: Number(form.sort),
    status: Number(form.status),
  };
}

function validateSupplierPayload(
  payload: ReturnType<typeof buildSupplierPayload>,
) {
  if (!payload.name) {
    message.error('请输入供应商名称');
    return false;
  }

  if (!payload.city) {
    message.error('请输入城市');
    return false;
  }

  if (!payload.main_products) {
    message.error('请输入主营产品');
    return false;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error('请输入正确的排序');
    return false;
  }

  return true;
}

async function createSupplier() {
  const payload = buildSupplierPayload(createForm.value);

  if (!validateSupplierPayload(payload)) {
    return;
  }

  try {
    createLoading.value = true;
    await createSupplierApi(payload);
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
    await updateSupplierApi({
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
    await deleteSupplierApi(id);
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
  <Page title="商品供应商">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item label="关键词">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            placeholder="供应商名称/主营产品"
            style="width: 210px"
            @press-enter="querySuppliers(1)"
          />
        </Form.Item>
        <Form.Item label="城市">
          <Input
            v-model:value="queryForm.city"
            allow-clear
            placeholder="城市"
            style="width: 140px"
            @press-enter="querySuppliers(1)"
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
      :scroll="{ x: 1480 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="openEdit(record as Supplier)">编辑</a>
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
        <template v-else-if="column.key === 'images'">
          <div v-if="record.images?.length" class="supplier-images">
            <div
              v-for="(image, index) in record.images.slice(0, 3)"
              :key="image"
              class="supplier-image-preview"
            >
              <AntImage
                :height="40"
                :src="resolveImageUrl(image)"
                :width="40"
                class="supplier-logo"
              />
              <span
                v-if="index === 2 && record.images.length > 3"
                class="supplier-image-count"
              >
                +{{ record.images.length - 3 }}
              </span>
            </div>
          </div>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'show_contact'">
          <Tag :color="record.show_contact === 1 ? 'green' : 'default'">
            {{ record.show_contact === 1 ? '展示' : '隐藏' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof Supplier] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增商品供应商"
      width="720px"
      @ok="createSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" label="供应商名称" required>
            <Input v-model:value="createForm.name" placeholder="请输入供应商名称" />
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
          <Form.Item class="supplier-form-full" label="供应商图片">
            <Upload
              v-model:file-list="imageFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadImages"
              @remove="(file) => removeImage(file.url)"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="城市" required>
            <Input v-model:value="createForm.city" placeholder="义乌" />
          </Form.Item>
          <Form.Item label="主营产品" required>
            <Input
              v-model:value="createForm.main_products"
              placeholder="手机配件、日用品"
            />
          </Form.Item>
          <Form.Item label="MOQ">
            <Input v-model:value="createForm.moq" placeholder="100件" />
          </Form.Item>
          <Form.Item label="WhatsApp">
            <Input
              v-model:value="createForm.contact_whatsapp"
              placeholder="+86..."
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
          <Form.Item label="展示联系方式">
            <Switch
              v-model:checked="createForm.show_contact"
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item class="supplier-form-full" label="描述">
            <Input.TextArea
              v-model:value="createForm.description"
              :rows="4"
              placeholder="请输入供应商描述"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      title="编辑商品供应商"
      width="720px"
      @ok="updateSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" label="供应商名称" required>
            <Input v-model:value="editForm.name" placeholder="请输入供应商名称" />
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
          <Form.Item class="supplier-form-full" label="供应商图片">
            <Upload
              v-model:file-list="editImageFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadEditImages"
              @remove="(file) => removeEditImage(file.url)"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="城市" required>
            <Input v-model:value="editForm.city" placeholder="义乌" />
          </Form.Item>
          <Form.Item label="主营产品" required>
            <Input
              v-model:value="editForm.main_products"
              placeholder="手机配件、日用品"
            />
          </Form.Item>
          <Form.Item label="MOQ">
            <Input v-model:value="editForm.moq" placeholder="100件" />
          </Form.Item>
          <Form.Item label="WhatsApp">
            <Input
              v-model:value="editForm.contact_whatsapp"
              placeholder="+86..."
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
          <Form.Item label="展示联系方式">
            <Switch
              v-model:checked="editForm.show_contact"
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item class="supplier-form-full" label="描述">
            <Input.TextArea
              v-model:value="editForm.description"
              :rows="4"
              placeholder="请输入供应商描述"
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

.supplier-images {
  display: flex;
  gap: 6px;
}

.supplier-image-preview {
  position: relative;
  width: 40px;
  height: 40px;
}

.supplier-image-count {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  color: #fff;
  background: rgb(0 0 0 / 60%);
  border-radius: 4px 0 4px;
}

@media (max-width: 768px) {
  .supplier-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
