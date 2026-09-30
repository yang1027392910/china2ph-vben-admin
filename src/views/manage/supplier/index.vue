<script lang="ts" setup>
import type { TableProps, UploadProps } from 'ant-design-vue';

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
import { $t } from '#/locales';

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

const statusOptions = computed(() => ([
  { label: $t('app.all'), value: '' },
  { label: $t('app.enable'), value: '1' },
  { label: $t('app.disable'), value: '0' },
]));

const columns = computed(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'Logo', dataIndex: 'logo', key: 'logo', width: 90 },
  { title: $t('app.supplierImage'), dataIndex: 'images', key: 'images', width: 180 },
  { title: $t('app.supplierName'), dataIndex: 'name', key: 'name', width: 180 },
  { title: $t('app.city'), dataIndex: 'city', key: 'city', width: 120 },
  {
    title: $t('app.mainProducts'),
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
  { title: $t('app.showContact'), dataIndex: 'show_contact', key: 'show_contact', width: 100 },
  { title: $t('app.sortOrder'), dataIndex: 'sort', key: 'sort', width: 80 },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 80 },
  { title: $t('app.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: $t('app.actions'), key: 'actions', width: 140, fixed: 'right' },
]));

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
    message.error(error?.message || $t('app.queryFailed'));
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
    message.error($t('app.selectAnImageFile'));
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
        throw new Error($t('app.theUploadResponseDidNotIncludeAnImageUrl'));
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
      message.success($t('app.logoUploaded'));
    } catch (error: any) {
      target.value.logo = '';
      fileList.value = [];
      options.onError?.(error);
      message.error(error?.message || $t('app.uploadFailed'));
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
        throw new Error($t('app.theUploadResponseDidNotIncludeAnImageUrl'));
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
      message.success($t('app.imageUploaded'));
    } catch (error: any) {
      options.onError?.(error);
      message.error(error?.message || $t('app.uploadFailed'));
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
    message.error($t('app.enterASupplierName'));
    return false;
  }

  if (!payload.city) {
    message.error($t('app.enterACity'));
    return false;
  }

  if (!payload.main_products) {
    message.error($t('app.enterTheMainProducts'));
    return false;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error($t('app.enterAValidSortOrder'));
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
    message.success($t('app.createdSuccessfully'));
    querySuppliers(1);
  } catch (error: any) {
    message.error(error?.message || $t('app.creationFailed'));
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
    message.success($t('app.updatedSuccessfully'));
    querySuppliers(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || $t('app.updateFailed'));
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
    message.success($t('app.deletedSuccessfully'));
  } catch (error: any) {
    message.error(error?.message || $t('app.deletionFailed'));
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  querySuppliers();
});
</script>

<template>
  <Page :title="$t('app.productSuppliers')">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item :label="$t('app.keyword')">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            :placeholder="$t('app.supplierNameOrMainProducts')"
            style="width: 210px"
            @press-enter="querySuppliers(1)"
          />
        </Form.Item>
        <Form.Item :label="$t('app.city')">
          <Input
            v-model:value="queryForm.city"
            allow-clear
            :placeholder="$t('app.city')"
            style="width: 140px"
            @press-enter="querySuppliers(1)"
          />
        </Form.Item>
        <Form.Item :label="$t('app.status')">
          <Select
            v-model:value="queryForm.status"
            :options="statusOptions"
            style="width: 100px"
          />
        </Form.Item>
      </Form>
      <Space>
        <Button :loading="queryLoading" @click="querySuppliers(1)">{{ $t('app.search') }}</Button>
        <Button @click="resetQuery">{{ $t('app.reset') }}</Button>
        <Button type="primary" @click="openCreate">{{ $t('app.addSupplier') }}</Button>
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
        showTotal: (count: number) => $t('app.valueRecords', { value1: count }),
        total,
      }"
      row-key="id"
      :scroll="{ x: 1480 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="openEdit(record as Supplier)">{{ $t('app.edit') }}</a>
            <Popconfirm
              :title="$t('app.deleteThisItem')"
              @confirm="() => removeSupplier(record.id)"
            >
              <a>
                {{ deleteLoadingId === record.id ? $t('app.deleting') : $t('app.delete') }}
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
            {{ record.show_contact === 1 ? $t('app.show') : $t('app.hide') }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? $t('app.enable') : $t('app.disable') }}
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
      :title="$t('app.addProductSupplier')"
      width="720px"
      @ok="createSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" :label="$t('app.supplierName')" required>
            <Input v-model:value="createForm.name" :placeholder="$t('app.enterASupplierName')" />
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
              <div>{{ $t('app.upload') }}</div>
            </Upload>
          </Form.Item>
          <Form.Item class="supplier-form-full" :label="$t('app.supplierImage')">
            <Upload
              v-model:file-list="imageFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadImages"
              @remove="(file) => removeImage(file.url)"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>{{ $t('app.upload') }}</div>
            </Upload>
          </Form.Item>
          <Form.Item :label="$t('app.city')" required>
            <Input v-model:value="createForm.city" :placeholder="$t('app.yiwu')" />
          </Form.Item>
          <Form.Item :label="$t('app.mainProducts')" required>
            <Input
              v-model:value="createForm.main_products"
              :placeholder="$t('app.phoneAccessoriesHouseholdEssentials')"
            />
          </Form.Item>
          <Form.Item label="MOQ">
            <Input v-model:value="createForm.moq" :placeholder="$t('app.text100Units')" />
          </Form.Item>
          <Form.Item label="WhatsApp">
            <Input
              v-model:value="createForm.contact_whatsapp"
              placeholder="+86..."
            />
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
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item :label="$t('app.showContactDetails')">
            <Switch
              v-model:checked="createForm.show_contact"
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item class="supplier-form-full" :label="$t('app.description')">
            <Input.TextArea
              v-model:value="createForm.description"
              :rows="4"
              :placeholder="$t('app.enterASupplierDescription')"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      :title="$t('app.editProductSupplier')"
      width="720px"
      @ok="updateSupplier"
    >
      <Form layout="vertical">
        <div class="supplier-form-grid">
          <Form.Item class="supplier-form-full" :label="$t('app.supplierName')" required>
            <Input v-model:value="editForm.name" :placeholder="$t('app.enterASupplierName')" />
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
              <div>{{ $t('app.upload') }}</div>
            </Upload>
          </Form.Item>
          <Form.Item class="supplier-form-full" :label="$t('app.supplierImage')">
            <Upload
              v-model:file-list="editImageFileList"
              :before-upload="beforeLogoUpload"
              :custom-request="uploadEditImages"
              @remove="(file) => removeEditImage(file.url)"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>{{ $t('app.upload') }}</div>
            </Upload>
          </Form.Item>
          <Form.Item :label="$t('app.city')" required>
            <Input v-model:value="editForm.city" :placeholder="$t('app.yiwu')" />
          </Form.Item>
          <Form.Item :label="$t('app.mainProducts')" required>
            <Input
              v-model:value="editForm.main_products"
              :placeholder="$t('app.phoneAccessoriesHouseholdEssentials')"
            />
          </Form.Item>
          <Form.Item label="MOQ">
            <Input v-model:value="editForm.moq" :placeholder="$t('app.text100Units')" />
          </Form.Item>
          <Form.Item label="WhatsApp">
            <Input
              v-model:value="editForm.contact_whatsapp"
              placeholder="+86..."
            />
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
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item :label="$t('app.showContactDetails')">
            <Switch
              v-model:checked="editForm.show_contact"
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <Form.Item class="supplier-form-full" :label="$t('app.description')">
            <Input.TextArea
              v-model:value="editForm.description"
              :rows="4"
              :placeholder="$t('app.enterASupplierDescription')"
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
