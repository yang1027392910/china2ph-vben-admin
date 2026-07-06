<script lang="ts" setup>
import type { TableProps, UploadProps } from 'ant-design-vue';

import type { ProductApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Image as AntImage,
  Button,
  Empty,
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
  addProductContactPermissionApi,
  aiGenerateProductApi,
  createProductApi,
  deleteProductContactPermissionApi,
  getAdminUserListApi,
  getCategoryListApi,
  getProductContactPermissionsApi,
  getProductListApi,
  updateProductApi,
  uploadProductImageApi,
} from '#/api';
import { RichTextEditor, sanitizeRichTextHtml } from '#/components/rich-text-editor';

type Product = {
  categoryId: number;
  chinaPrice: number;
  cover: string;
  description: string;
  id: number | string;
  images: string[];
  minimumOrderQuantity: number;
  phPrice: number;
  profit: number;
  sales: number;
  shippingFee: number;
  showSupplierContact: number;
  status: number;
  stock: number;
  subtitle: string;
  supplierName: string;
  supplierPhone: string;
  supplierWechat: string;
  supplierWhatsapp: string;
  title: string;
};

type ProductForm = Omit<Product, 'id'>;

type CategoryOption = {
  label: string;
  value: number;
};

type UserOption = {
  label: string;
  value: number;
};

type AuthorizedUserPreviewRow = {
  email: string;
  key: number;
  status: 'added' | 'removed' | 'unchanged';
  userId: number;
};

const defaultQuery = {
  category: '',
  hotType: '',
  page: 1,
  pageSize: 10,
  title: '',
};

const defaultForm: ProductForm = {
  categoryId: 1,
  chinaPrice: 100,
  cover: '',
  description: '',
  images: [],
  minimumOrderQuantity: 1,
  phPrice: 180,
  profit: 60,
  sales: 0,
  shippingFee: 20,
  showSupplierContact: 0,
  status: 1,
  stock: 99,
  subtitle: '',
  supplierName: '',
  supplierPhone: '',
  supplierWechat: '',
  supplierWhatsapp: '',
  title: '',
};

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

const products = ref<Product[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<ProductForm>({ ...defaultForm, images: [] });
const editVisible = ref(false);
const editLoading = ref(false);
const aiGenerateLoading = ref(false);
const editForm = ref<Product>({ ...defaultForm, id: '', images: [] });
const coverFileList = ref<UploadProps['fileList']>([]);
const imageFileList = ref<UploadProps['fileList']>([]);
const editCoverFileList = ref<UploadProps['fileList']>([]);
const editImageFileList = ref<UploadProps['fileList']>([]);
const categoryLoading = ref(false);
const categoryOptions = ref<CategoryOption[]>([]);
const contactPermissionLoading = ref(false);
const originalAuthorizedUserIds = ref<number[]>([]);
const selectedAuthorizedUserIds = ref<number[]>([]);
const userOptions = ref<UserOption[]>([]);
let contactPermissionLoadVersion = 0;

const hotTypeOptions = [
  { label: '全部', value: '' },
  { label: 'today', value: 'today' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'new_alert', value: 'new_alert' },
];

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '封面图', dataIndex: 'cover', key: 'cover' },
  { title: '产品图片', dataIndex: 'images', key: 'images' },
  { title: '分类ID', dataIndex: 'categoryId', key: 'categoryId' },
  { title: '中国价格', dataIndex: 'chinaPrice', key: 'chinaPrice' },
  { title: '菲律宾价格', dataIndex: 'phPrice', key: 'phPrice' },
  { title: '库存', dataIndex: 'stock', key: 'stock' },
  {
    title: '最低起订量',
    dataIndex: 'minimumOrderQuantity',
    key: 'minimumOrderQuantity',
  },
  { title: '销量', dataIndex: 'sales', key: 'sales' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'actions' },
];

const authorizedUserPreviewColumns = [
  { title: '用户', dataIndex: 'email', key: 'email' },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
];

const authorizedUserPreviewRows = computed<AuthorizedUserPreviewRow[]>(() => {
  const originalUserIdSet = new Set(originalAuthorizedUserIds.value);
  const selectedUserIdSet = new Set(selectedAuthorizedUserIds.value);
  const userIds = [
    ...selectedAuthorizedUserIds.value,
    ...originalAuthorizedUserIds.value.filter(
      (userId) => !selectedUserIdSet.has(userId),
    ),
  ];

  return userIds.map((userId) => {
    let status: AuthorizedUserPreviewRow['status'] = 'added';

    if (originalUserIdSet.has(userId)) {
      status = selectedUserIdSet.has(userId) ? 'unchanged' : 'removed';
    }

    return {
      email: getUserOptionLabel(userId),
      key: userId,
      status,
      userId,
    };
  });
});

const authorizedUserStatusMap: Record<
  AuthorizedUserPreviewRow['status'],
  { color: string; text: string }
> = {
  added: { color: 'green', text: '新增' },
  removed: { color: 'red', text: '待移除' },
  unchanged: { color: 'blue', text: '已授权' },
};

function normalizeProducts(data: any): Product[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => ({
    categoryId: Number(item.categoryId ?? 0),
    chinaPrice: Number(item.chinaPrice ?? 0),
    cover: item.cover ?? '',
    description: item.description ?? '',
    id: item.id,
    images: normalizeProductImages(item.images),
    minimumOrderQuantity: Number(item.minimumOrderQuantity ?? 1),
    phPrice: Number(item.phPrice ?? 0),
    profit: Number(item.profit ?? 0),
    sales: Number(item.sales ?? 0),
    shippingFee: Number(item.shippingFee ?? 0),
    showSupplierContact: Number(item.showSupplierContact ?? 0),
    status: Number(item.status ?? 1),
    stock: Number(item.stock ?? 0),
    subtitle: item.subtitle ?? '',
    supplierName: item.supplierName ?? '',
    supplierPhone: item.supplierPhone ?? '',
    supplierWechat: item.supplierWechat ?? '',
    supplierWhatsapp: item.supplierWhatsapp ?? '',
    title: item.title ?? '',
  }));
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeProductImages(images: any): string[] {
  if (Array.isArray(images)) {
    return images.filter(Boolean);
  }

  if (typeof images !== 'string') {
    return [];
  }

  const value = images.trim();
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch {
    // Fall through to comma-separated fallback.
  }

  return value
    .split(',')
    .map((item) => item.trim().replaceAll(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function getCategoryName(categoryId: number) {
  return (
    categoryOptions.value.find((item) => item.value === categoryId)?.label ||
    String(categoryId)
  );
}

function getAiGeneratedDescription(data: ProductApi.ProductAiGenerateResponse) {
  if (typeof data === 'string') {
    return data;
  }

  return (
    data?.descriptionHtml ||
    data?.description ||
    data?.content ||
    data?.text ||
    data?.result ||
    data?.data?.descriptionHtml ||
    data?.data?.description ||
    data?.data?.content ||
    data?.data?.text ||
    ''
  );
}

function normalizeCategoryOptions(data: any): CategoryOption[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list
    .map((item: any) => ({
      label: item.name ?? item.title ?? `分类 ${item.id}`,
      value: Number(item.id),
    }))
    .filter((item: CategoryOption) => Number.isFinite(item.value));
}

function normalizeContactPermissions(
  data: unknown,
): ProductApi.ContactPermission[] {
  return Array.isArray(data)
    ? data
        .map((item: any) => ({
          createdAt: String(item.createdAt ?? ''),
          email: String(item.email ?? ''),
          userId: Number(item.userId),
        }))
        .filter((item) => Number.isFinite(item.userId))
    : [];
}

function normalizeUserOptions(data: any): UserOption[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list
    .map((item: any) => ({
      label: String(item.email ?? ''),
      value: Number(item.id ?? item.userId),
    }))
    .filter((item: UserOption) => item.label && Number.isFinite(item.value));
}

function getUserOptionLabel(userId: number) {
  return (
    userOptions.value.find((item) => item.value === userId)?.label ||
    `用户 ${userId}`
  );
}

function updateSelectedAuthorizedUsers(nextValue: unknown) {
  const nextUserIds = (Array.isArray(nextValue) ? nextValue : [])
    .map(Number)
    .filter((item) => Number.isFinite(item));
  const nextUserIdSet = new Set(nextUserIds);
  const removedUserIds = selectedAuthorizedUserIds.value.filter(
    (userId) => !nextUserIdSet.has(userId),
  );

  if (removedUserIds.length === 0) {
    selectedAuthorizedUserIds.value = nextUserIds;
    return;
  }

  Modal.confirm({
    cancelText: '取消',
    content: `将移除 ${removedUserIds
      .map((userId) => getUserOptionLabel(userId))
      .join('、')} 的供应商联系方式查看权限，保存后生效。`,
    okText: '确认移除',
    okType: 'danger',
    onOk: () => {
      selectedAuthorizedUserIds.value = nextUserIds;
    },
    title: '确认移除授权用户？',
  });
}

async function copyAuthorizedUser(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
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

function buildUploadFile(file: File, url: string) {
  return {
    name: file.name,
    response: url,
    status: 'done' as const,
    uid: `${Date.now()}-${file.name}`,
    url: resolveImageUrl(url),
  };
}

function buildExistingUploadFile(url: string, uid: string) {
  return {
    name: url.split('/').pop() || 'image',
    response: url,
    status: 'done' as const,
    uid,
    url: resolveImageUrl(url),
  };
}

async function queryProducts(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getProductListApi({
      category: queryForm.value.category || undefined,
      hotType: queryForm.value.hotType || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
      title: queryForm.value.title.trim() || undefined,
    });
    products.value = normalizeProducts(responseData);
    total.value = normalizeTotal(responseData, products.value.length);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
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
  queryProducts(queryForm.value.page);
}

async function queryCategoryOptions() {
  try {
    categoryLoading.value = true;
    const responseData = await getCategoryListApi({ status: '1' });
    categoryOptions.value = normalizeCategoryOptions(responseData);
    if (
      !categoryOptions.value.some(
        (item) => item.value === createForm.value.categoryId,
      )
    ) {
      createForm.value.categoryId =
        categoryOptions.value[0]?.value ?? defaultForm.categoryId;
    }
  } catch (error: any) {
    message.error(error?.message || '分类查询失败');
  } finally {
    categoryLoading.value = false;
  }
}

function openCreate() {
  createForm.value = { ...defaultForm, images: [] };
  coverFileList.value = [];
  imageFileList.value = [];
  createVisible.value = true;
  queryCategoryOptions();
}

async function openEdit(record: Product) {
  const loadVersion = ++contactPermissionLoadVersion;

  editForm.value = {
    ...record,
    images: [...(record.images || [])],
  };
  editCoverFileList.value = record.cover
    ? [buildExistingUploadFile(record.cover, `${record.id}-cover`)]
    : [];
  editImageFileList.value = (record.images || []).map((image, index) =>
    buildExistingUploadFile(image, `${record.id}-image-${index}`),
  );
  originalAuthorizedUserIds.value = [];
  selectedAuthorizedUserIds.value = [];
  userOptions.value = [];
  editVisible.value = true;
  queryCategoryOptions();

  try {
    contactPermissionLoading.value = true;
    const [permissionData, userData] = await Promise.all([
      getProductContactPermissionsApi(record.id),
      getAdminUserListApi({ page: 1, pageSize: 100 }),
    ]);

    if (loadVersion !== contactPermissionLoadVersion) {
      return;
    }

    const permissions = normalizeContactPermissions(permissionData);
    const options = normalizeUserOptions(userData);
    const optionUserIds = new Set(options.map((item) => item.value));

    permissions.forEach((permission) => {
      if (!optionUserIds.has(permission.userId)) {
        options.push({
          label: permission.email || `用户 ${permission.userId}`,
          value: permission.userId,
        });
      }
    });

    const authorizedUserIds = permissions.map((item) => item.userId);
    userOptions.value = options;
    originalAuthorizedUserIds.value = [...authorizedUserIds];
    selectedAuthorizedUserIds.value = [...authorizedUserIds];
  } catch (error: any) {
    if (loadVersion === contactPermissionLoadVersion) {
      message.error(error?.message || '授权用户加载失败');
    }
  } finally {
    if (loadVersion === contactPermissionLoadVersion) {
      contactPermissionLoading.value = false;
    }
  }
}

function beforeImageUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件');
    return false;
  }
  return true;
}

const uploadCover: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadProductImageApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    createForm.value.cover = imageUrl;
    coverFileList.value = [buildUploadFile(file, imageUrl)];
    options.onSuccess?.(responseData);
    message.success('封面上传成功');
  } catch (error: any) {
    createForm.value.cover = '';
    coverFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadProductImage: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadProductImageApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    createForm.value.images = [...createForm.value.images, imageUrl];
    imageFileList.value = [
      ...(imageFileList.value || []),
      buildUploadFile(file, imageUrl),
    ];
    options.onSuccess?.(responseData);
    message.success('图片上传成功');
  } catch (error: any) {
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadEditCover: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File;

  try {
    const responseData = await uploadProductImageApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    editForm.value.cover = imageUrl;
    editCoverFileList.value = [buildUploadFile(file, imageUrl)];
    options.onSuccess?.(responseData);
    message.success('封面上传成功');
  } catch (error: any) {
    editForm.value.cover = '';
    editCoverFileList.value = [];
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

const uploadEditProductImage: UploadProps['customRequest'] = async (
  options,
) => {
  const file = options.file as File;

  try {
    const responseData = await uploadProductImageApi(file);
    const imageUrl = getUploadedImageUrl(responseData);

    if (!imageUrl) {
      throw new Error('上传接口未返回图片地址');
    }

    editForm.value.images = [...editForm.value.images, imageUrl];
    editImageFileList.value = [
      ...(editImageFileList.value || []),
      buildUploadFile(file, imageUrl),
    ];
    options.onSuccess?.(responseData);
    message.success('图片上传成功');
  } catch (error: any) {
    options.onError?.(error);
    message.error(error?.message || '上传失败');
  }
};

function removeCover() {
  createForm.value.cover = '';
  coverFileList.value = [];
}

function removeProductImage(
  file: NonNullable<UploadProps['fileList']>[number],
) {
  const rawUrl = typeof file.response === 'string' ? file.response : '';
  createForm.value.images = createForm.value.images.filter(
    (url) => url !== rawUrl && resolveImageUrl(url) !== file.url,
  );
  imageFileList.value = (imageFileList.value || []).filter(
    (item) => item.uid !== file.uid,
  );
  return true;
}

function removeEditCover() {
  editForm.value.cover = '';
  editCoverFileList.value = [];
}

function removeEditProductImage(
  file: NonNullable<UploadProps['fileList']>[number],
) {
  const rawUrl = typeof file.response === 'string' ? file.response : '';
  editForm.value.images = editForm.value.images.filter(
    (url) => url !== rawUrl && resolveImageUrl(url) !== file.url,
  );
  editImageFileList.value = (editImageFileList.value || []).filter(
    (item) => item.uid !== file.uid,
  );
  return true;
}

function buildProductPayload(form: ProductForm) {
  return {
    categoryId: Number(form.categoryId),
    chinaPrice: Number(form.chinaPrice),
    cover: form.cover.trim(),
    description: sanitizeRichTextHtml(form.description),
    images: form.images,
    minimumOrderQuantity: Number(form.minimumOrderQuantity),
    phPrice: Number(form.phPrice),
    profit: Number(form.profit),
    sales: Number(form.sales),
    shippingFee: Number(form.shippingFee),
    showSupplierContact: Number(form.showSupplierContact),
    status: Number(form.status),
    stock: Number(form.stock),
    subtitle: form.subtitle.trim(),
    supplierName: form.supplierName.trim(),
    supplierPhone: form.supplierPhone.trim(),
    supplierWechat: form.supplierWechat.trim(),
    supplierWhatsapp: form.supplierWhatsapp.trim(),
    title: form.title.trim(),
  };
}

function validateProductPayload(
  payload: ReturnType<typeof buildProductPayload>,
) {
  if (!payload.title) {
    message.error('请输入商品标题');
    return false;
  }

  return true;
}

async function handleAiGenerateDescription() {
  const product = editForm.value;

  if (!product.id) {
    message.error('请先选择商品');
    return;
  }

  try {
    aiGenerateLoading.value = true;
    const responseData = await aiGenerateProductApi({
      categoryName: getCategoryName(Number(product.categoryId)),
      chinaPrice: Number(product.chinaPrice),
      language: 'English',
      minimumOrderQuantity: Number(product.minimumOrderQuantity),
      phPrice: Number(product.phPrice),
      productId: product.id,
      profit: Number(product.profit),
      sales: Number(product.sales),
      shippingFee: Number(product.shippingFee),
      stock: Number(product.stock),
      subtitle: product.subtitle.trim(),
      targetMarket: 'Philippines',
      title: product.title.trim(),
    });
    const description = getAiGeneratedDescription(responseData);

    if (!description) {
      message.error('AI生成接口未返回商品描述');
      return;
    }

    product.description = description;
    message.success('AI生成成功');
  } catch (error: any) {
    message.error(error?.message || 'AI生成失败');
  } finally {
    aiGenerateLoading.value = false;
  }
}

async function createProduct() {
  const form = createForm.value;
  const payload = {
    categoryId: Number(form.categoryId),
    chinaPrice: Number(form.chinaPrice),
    cover: form.cover.trim(),
    description: sanitizeRichTextHtml(form.description),
    images: form.images,
    minimumOrderQuantity: Number(form.minimumOrderQuantity),
    phPrice: Number(form.phPrice),
    profit: Number(form.profit),
    sales: Number(form.sales),
    shippingFee: Number(form.shippingFee),
    showSupplierContact: Number(form.showSupplierContact),
    status: Number(form.status),
    stock: Number(form.stock),
    subtitle: form.subtitle.trim(),
    supplierName: form.supplierName.trim(),
    supplierPhone: form.supplierPhone.trim(),
    supplierWechat: form.supplierWechat.trim(),
    supplierWhatsapp: form.supplierWhatsapp.trim(),
    title: form.title.trim(),
  };

  if (!payload.title) {
    message.error('请输入商品标题');
    return;
  }

  try {
    createLoading.value = true;
    const createdProduct = (await createProductApi(payload)) as
      | Partial<Product>
      | undefined;

    products.value.unshift({
      ...payload,
      id: createdProduct?.id || Date.now(),
    });
    total.value += 1;
    createVisible.value = false;
    message.success('新增成功');
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

async function updateProduct() {
  if (contactPermissionLoading.value) {
    return;
  }

  const payload = buildProductPayload(editForm.value);

  if (!validateProductPayload(payload)) {
    return;
  }

  try {
    editLoading.value = true;
    await updateProductApi({
      ...payload,
      id: editForm.value.id,
    });

    const originalUserIds = new Set(originalAuthorizedUserIds.value);
    const selectedUserIds = new Set(selectedAuthorizedUserIds.value);
    const addedUserIds = selectedAuthorizedUserIds.value.filter(
      (userId) => !originalUserIds.has(userId),
    );
    const deletedUserIds = originalAuthorizedUserIds.value.filter(
      (userId) => !selectedUserIds.has(userId),
    );

    await Promise.all([
      ...addedUserIds.map((userId) =>
        addProductContactPermissionApi(editForm.value.id, userId),
      ),
      ...deletedUserIds.map((userId) =>
        deleteProductContactPermissionApi(editForm.value.id, userId),
      ),
    ]);

    editVisible.value = false;
    message.success('保存成功');
    await queryProducts();
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
}

function remove(id: number | string) {
  products.value = products.value.filter((i) => i.id !== id);
  total.value = Math.max(total.value - 1, 0);
  message.success('已删除');
}

onMounted(() => {
  queryProducts();
  queryCategoryOptions();
});
</script>

<template>
  <Page title="商品管理">
    <div class="mb-4 flex gap-2">
      <Select
        v-model:value="queryForm.hotType"
        :options="hotTypeOptions"
        placeholder="热门类型"
        style="width: 140px"
      />
      <Select
        v-model:value="queryForm.category"
        :loading="categoryLoading"
        :options="[{ label: '全部分类', value: '' }, ...categoryOptions]"
        allow-clear
        placeholder="请选择分类"
        style="width: 180px"
      />
      <Input
        v-model:value="queryForm.title"
        allow-clear
        placeholder="请输入商品标题"
        style="width: 240px"
        @press-enter="queryProducts(1)"
      />
      <Button :loading="queryLoading" @click="queryProducts(1)">查询</Button>
      <Button type="primary" @click="openCreate">新增商品</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="products"
      :pagination="{
        current: queryForm.page,
        pageSize: queryForm.pageSize,
        showSizeChanger: true,
        total,
      }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <a @click="openEdit(record as Product)">编辑</a>
            <Popconfirm title="确定删除？" @confirm="() => remove(record.id)">
              <a>删除</a>
            </Popconfirm>
          </Space>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </template>
        <template v-else-if="column.key === 'cover'">
          <AntImage
            v-if="record.cover"
            :height="48"
            :src="resolveImageUrl(record.cover)"
            :width="48"
            class="product-cover"
            @error="message.error('图片加载失败')"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'images'">
          <div v-if="record.images?.length" class="product-images">
            <AntImage.PreviewGroup>
              <div class="product-image-preview">
                <AntImage
                  :height="48"
                  :src="resolveImageUrl(record.images[0])"
                  :width="48"
                  class="product-cover"
                  @error="message.error('图片加载失败')"
                />
                <span
                  v-if="record.images.length > 1"
                  class="product-image-count"
                >
                  +{{ record.images.length - 1 }}
                </span>
              </div>
              <div
                v-for="(image, index) in record.images.slice(1)"
                :key="`${record.id}-preview-${index}-${image}`"
                class="product-image-hidden"
              >
                <AntImage
                  :src="resolveImageUrl(image)"
                  @error="message.error('图片加载失败')"
                />
              </div>
            </AntImage.PreviewGroup>
          </div>
          <span v-else>-</span>
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof Product] }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增商品"
      width="820px"
      @ok="createProduct"
    >
      <Form layout="vertical">
        <div class="product-form-grid">
          <Form.Item class="product-form-full" label="商品标题" required>
            <Input v-model:value="createForm.title" />
          </Form.Item>
          <Form.Item label="产品类型" required>
            <Select
              v-model:value="createForm.categoryId"
              :loading="categoryLoading"
              :options="categoryOptions"
              class="w-full"
              placeholder="请选择分类"
            />
          </Form.Item>
          <Form.Item label="封面图">
            <Upload
              v-model:file-list="coverFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadCover"
              :max-count="1"
              @remove="removeCover"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="产品图片">
            <Upload
              v-model:file-list="imageFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadProductImage"
              @remove="removeProductImage"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="中国价格">
            <InputNumber v-model:value="createForm.chinaPrice" class="w-full" />
          </Form.Item>
          <Form.Item label="运费">
            <InputNumber
              v-model:value="createForm.shippingFee"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="菲律宾价格">
            <InputNumber v-model:value="createForm.phPrice" class="w-full" />
          </Form.Item>
          <Form.Item label="利润">
            <InputNumber v-model:value="createForm.profit" class="w-full" />
          </Form.Item>
          <Form.Item label="库存">
            <InputNumber v-model:value="createForm.stock" class="w-full" />
          </Form.Item>
          <Form.Item label="最低起订量">
            <InputNumber
              v-model:value="createForm.minimumOrderQuantity"
              :min="1"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="销量">
            <InputNumber v-model:value="createForm.sales" class="w-full" />
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
      :confirm-loading="editLoading || contactPermissionLoading"
      title="编辑商品"
      width="820px"
      @ok="updateProduct"
    >
      <Form layout="vertical">
        <div class="product-form-grid">
          <Form.Item class="product-form-full" label="商品标题" required>
            <Input v-model:value="editForm.title" />
          </Form.Item>
          <Form.Item label="产品类型" required>
            <Select
              v-model:value="editForm.categoryId"
              :loading="categoryLoading"
              :options="categoryOptions"
              class="w-full"
              placeholder="请选择分类"
            />
          </Form.Item>
          <Form.Item label="封面图">
            <Upload
              v-model:file-list="editCoverFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadEditCover"
              :max-count="1"
              @remove="removeEditCover"
              accept="image/*"
              list-type="picture-card"
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item label="产品图片">
            <Upload
              v-model:file-list="editImageFileList"
              :before-upload="beforeImageUpload"
              :custom-request="uploadEditProductImage"
              @remove="removeEditProductImage"
              accept="image/*"
              list-type="picture-card"
              multiple
            >
              <div>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item class="product-form-full" label="商品描述">
            <RichTextEditor
              v-model="editForm.description"
              :ai-loading="aiGenerateLoading"
              @ai-generate="handleAiGenerateDescription"
            />
          </Form.Item>
          <Form.Item label="中国价格">
            <InputNumber v-model:value="editForm.chinaPrice" class="w-full" />
          </Form.Item>
          <Form.Item label="运费">
            <InputNumber v-model:value="editForm.shippingFee" class="w-full" />
          </Form.Item>
          <Form.Item label="菲律宾价格">
            <InputNumber v-model:value="editForm.phPrice" class="w-full" />
          </Form.Item>
          <Form.Item label="利润">
            <InputNumber v-model:value="editForm.profit" class="w-full" />
          </Form.Item>
          <Form.Item label="库存">
            <InputNumber v-model:value="editForm.stock" class="w-full" />
          </Form.Item>
          <Form.Item label="最低起订量">
            <InputNumber
              v-model:value="editForm.minimumOrderQuantity"
              :min="1"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="销量">
            <InputNumber v-model:value="editForm.sales" class="w-full" />
          </Form.Item>
          <Form.Item label="启用">
            <Switch
              v-model:checked="editForm.status"
              :checked-value="1"
              :un-checked-value="0"
            />
          </Form.Item>
          <div class="product-form-full supplier-contact-section">
            <div class="supplier-contact-title">供应商联系方式</div>
            <Form.Item label="开启供应商联系方式">
              <Switch
                v-model:checked="editForm.showSupplierContact"
                :checked-value="1"
                :un-checked-value="0"
              />
            </Form.Item>

            <div
              v-if="editForm.showSupplierContact === 1"
              class="supplier-contact-grid"
            >
              <Form.Item label="供应商名称">
                <Input v-model:value="editForm.supplierName" />
              </Form.Item>
              <Form.Item label="WhatsApp">
                <Input v-model:value="editForm.supplierWhatsapp" />
              </Form.Item>
              <Form.Item label="微信">
                <Input v-model:value="editForm.supplierWechat" />
              </Form.Item>
              <Form.Item label="电话">
                <Input v-model:value="editForm.supplierPhone" />
              </Form.Item>
              <Form.Item class="product-form-full" label="授权用户">
                <Select
                  :filter-option="true"
                  :loading="contactPermissionLoading"
                  :options="userOptions"
                  :value="selectedAuthorizedUserIds"
                  allow-clear
                  mode="multiple"
                  option-filter-prop="label"
                  placeholder="请选择可查看供应商联系方式的用户"
                  show-search
                  @change="updateSelectedAuthorizedUsers"
                >
                  <template #notFoundContent>
                    <Empty
                      :image="Empty.PRESENTED_IMAGE_SIMPLE"
                      description="暂无用户"
                    />
                  </template>
                </Select>
                <Table
                  v-if="authorizedUserPreviewRows.length > 0"
                  :columns="authorizedUserPreviewColumns"
                  :data-source="authorizedUserPreviewRows"
                  :pagination="false"
                  class="authorized-user-preview-table"
                  row-key="key"
                  size="small"
                >
                  <template #bodyCell="{ record, column }">
                    <template v-if="column.key === 'status'">
                      <Tag
                        :color="
                          authorizedUserStatusMap[
                            record.status as AuthorizedUserPreviewRow['status']
                          ].color
                        "
                      >
                        {{
                          authorizedUserStatusMap[
                            record.status as AuthorizedUserPreviewRow['status']
                          ].text
                        }}
                      </Tag>
                    </template>
                    <template v-else-if="column.key === 'email'">
                      <Space>
                        <span>{{ record.email }}</span>
                        <Button
                          size="small"
                          type="link"
                          @click="copyAuthorizedUser(record.email)"
                        >
                          复制
                        </Button>
                      </Space>
                    </template>
                    <template v-else>
                      {{
                        record[
                          column.dataIndex as keyof AuthorizedUserPreviewRow
                        ]
                      }}
                    </template>
                  </template>
                </Table>
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.product-cover {
  object-fit: cover;
  border-radius: 4px;
}

.product-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 16px;
  max-height: min(68vh, 680px);
  padding-right: 4px;
  overflow-y: auto;
}

.product-form-full {
  grid-column: 1 / -1;
}

.product-images {
  width: 48px;
}

.product-image-preview {
  position: relative;
  width: 48px;
  height: 48px;
}

.product-image-count {
  position: absolute;
  right: 0;
  bottom: 0;
  min-width: 20px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 18px;
  color: #fff;
  text-align: center;
  background: rgb(0 0 0 / 65%);
  border-radius: 4px 0;
}

.product-image-hidden {
  display: none !important;
}

.supplier-contact-section {
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.supplier-contact-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.supplier-contact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.authorized-user-preview-table {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .product-form-grid {
    grid-template-columns: 1fr;
    max-height: 70vh;
  }

  .supplier-contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
