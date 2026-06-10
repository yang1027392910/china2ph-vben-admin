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
  Select,
  Space,
  Switch,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  createProductApi,
  getCategoryListApi,
  getProductListApi,
  uploadProductImageApi,
} from '#/api';

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
  status: number;
  stock: number;
  subtitle: string;
  title: string;
};

type ProductForm = Omit<Product, 'id'>;

type CategoryOption = {
  label: string;
  value: number;
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
  status: 1,
  stock: 99,
  subtitle: '',
  title: '',
};

const localUploadOrigin = 'http://localhost:3000';

const products = ref<Product[]>([]);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<ProductForm>({ ...defaultForm, images: [] });
const coverFileList = ref<UploadProps['fileList']>([]);
const imageFileList = ref<UploadProps['fileList']>([]);
const categoryLoading = ref(false);
const categoryOptions = ref<CategoryOption[]>([]);

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
    status: Number(item.status ?? 1),
    stock: Number(item.stock ?? 0),
    subtitle: item.subtitle ?? '',
    title: item.title ?? '',
  }));
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
    return `${localUploadOrigin}${url}`;
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

async function queryProducts() {
  try {
    queryLoading.value = true;
    const responseData = await getProductListApi();
    products.value = normalizeProducts(responseData);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
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

async function createProduct() {
  const form = createForm.value;
  const payload = {
    categoryId: Number(form.categoryId),
    chinaPrice: Number(form.chinaPrice),
    cover: form.cover.trim(),
    description: form.description.trim(),
    images: form.images,
    minimumOrderQuantity: Number(form.minimumOrderQuantity),
    phPrice: Number(form.phPrice),
    profit: Number(form.profit),
    sales: Number(form.sales),
    shippingFee: Number(form.shippingFee),
    status: Number(form.status),
    stock: Number(form.stock),
    subtitle: form.subtitle.trim(),
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
    createVisible.value = false;
    message.success('新增成功');
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

function remove(id: number | string) {
  products.value = products.value.filter((i) => i.id !== id);
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
      <Button :loading="queryLoading" @click="queryProducts">查询</Button>
      <Button type="primary" @click="openCreate">新增商品</Button>
    </div>

    <Table :columns="columns" :data-source="products" row-key="id">
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
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
          <Form.Item class="product-form-full" label="副标题">
            <Input v-model:value="createForm.subtitle" />
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
          <Form.Item class="product-form-full" label="商品描述">
            <Input.TextArea
              v-model:value="createForm.description"
              :auto-size="{ minRows: 3, maxRows: 6 }"
            />
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

@media (max-width: 768px) {
  .product-form-grid {
    grid-template-columns: 1fr;
    max-height: 70vh;
  }
}
</style>
