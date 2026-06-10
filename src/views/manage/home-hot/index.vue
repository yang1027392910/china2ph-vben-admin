<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

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
} from 'ant-design-vue';

import {
  createHotProductApi,
  deleteHotProductApi,
  getCategoryListApi,
  getHotProductListApi,
  getProductListApi,
} from '#/api';

type HotType = 'month' | 'new_alert' | 'today' | 'week';

type HotProduct = {
  categoryId: number;
  categoryName: string;
  cover: string;
  createdAt?: string;
  hotType: HotType | string;
  id: number | string;
  productId: number;
  sort: number;
  status: number;
  title: string;
};

type ProductOption = {
  categoryId: number;
  cover: string;
  label: string;
  title: string;
  value: number;
};

type ProductMeta = {
  categoryId: number;
  cover: string;
  title: string;
};

type HotProductForm = {
  hotType: HotType;
  productId?: number;
  sort: number;
  status: number;
};

const defaultQuery = {
  hotType: '',
  keyword: '',
  page: 1,
  pageSize: 10,
  status: '1',
};

const defaultForm: HotProductForm = {
  hotType: 'today',
  productId: undefined,
  sort: 1,
  status: 1,
};

const hotProducts = ref<HotProduct[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<HotProductForm>({ ...defaultForm });
const categoryMap = ref<Record<number, string>>({});
const deleteLoadingId = ref<number | string>('');
const productLoading = ref(false);
const productMap = ref<Record<number, ProductMeta>>({});
const productOptions = ref<ProductOption[]>([]);

const localUploadOrigin = 'http://localhost:3000';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

const hotTypeOptions = [
  { label: 'today', value: 'today' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'new_alert', value: 'new_alert' },
];

const columns = [
  { title: '热门类型', dataIndex: 'hotType', key: 'hotType', width: 120 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '商品ID', dataIndex: 'productId', key: 'productId', width: 100 },
  {
    title: '所属类目',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 140,
  },
  { title: '商品标题', dataIndex: 'title', key: 'title', width: 260 },
  { title: '封面', dataIndex: 'cover', key: 'cover', width: 88 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100 },
];

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeHotProducts(data: any): HotProduct[] {
  return normalizeList(data).map((item: any) => {
    const productId = Number(item.productId ?? item.product?.id ?? 0);
    const product = productMap.value[productId];
    const categoryId = Number(
      item.categoryId ?? item.product?.categoryId ?? product?.categoryId ?? 0,
    );

    return {
      categoryId,
      categoryName:
        item.categoryName ??
        item.category?.name ??
        categoryMap.value[categoryId] ??
        (categoryId ? `分类 ${categoryId}` : ''),
      cover: item.cover ?? item.product?.cover ?? product?.cover ?? '',
      createdAt: item.createdAt ?? '',
      hotType: item.hotType ?? item.type ?? '',
      id: item.id,
      productId,
      sort: Number(item.sort ?? item.rankNo ?? 0),
      status: Number(item.status ?? 0),
      title:
        item.title ??
        item.productTitle ??
        item.product?.title ??
        product?.title ??
        '',
    };
  });
}

function normalizeProductOptions(data: any): ProductOption[] {
  return normalizeList(data)
    .map((item: any) => ({
      categoryId: Number(item.categoryId ?? 0),
      cover: item.cover ?? '',
      label: item.title ? `${item.title} (ID: ${item.id})` : `商品 ${item.id}`,
      title: item.title ?? '',
      value: Number(item.id),
    }))
    .filter((item: ProductOption) => Number.isFinite(item.value));
}

function normalizeCategoryMap(data: any) {
  return normalizeList(data).reduce(
    (map: Record<number, string>, item: any) => {
      const id = Number(item.id);
      if (Number.isFinite(id)) {
        map[id] = item.name ?? item.title ?? '';
      }
      return map;
    },
    {},
  );
}

function buildProductMap(products: ProductOption[]) {
  return products.reduce((map: Record<number, ProductMeta>, item) => {
    map[item.value] = {
      categoryId: item.categoryId,
      cover: item.cover,
      title: item.title,
    };
    return map;
  }, {});
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
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

async function queryHotProducts(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getHotProductListApi({
      hotType: queryForm.value.hotType || undefined,
      keyword: queryForm.value.keyword.trim() || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
      status: queryForm.value.status,
    });

    hotProducts.value = normalizeHotProducts(responseData);
    total.value = normalizeTotal(responseData, hotProducts.value.length);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

async function queryProductOptions() {
  try {
    productLoading.value = true;
    const responseData = await getProductListApi();
    productOptions.value = normalizeProductOptions(responseData);
    productMap.value = buildProductMap(productOptions.value);
  } catch (error: any) {
    message.error(error?.message || '产品查询失败');
  } finally {
    productLoading.value = false;
  }
}

async function queryCategoryMap() {
  try {
    const responseData = await getCategoryListApi({ status: '1' });
    categoryMap.value = normalizeCategoryMap(responseData);
  } catch (error: any) {
    message.error(error?.message || '分类查询失败');
  }
}

function resetQuery() {
  queryForm.value = { ...defaultQuery };
  queryHotProducts(1);
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  queryHotProducts(queryForm.value.page);
}

function openCreate() {
  createForm.value = { ...defaultForm };
  createVisible.value = true;
  queryProductOptions();
}

async function createHotProduct() {
  const form = createForm.value;
  const payload = {
    hotType: form.hotType,
    productId: Number(form.productId),
    sort: Number(form.sort),
    status: Number(form.status),
  };

  if (!payload.productId) {
    message.error('请选择产品');
    return;
  }

  if (!payload.hotType) {
    message.error('请选择热门类型');
    return;
  }

  if (!Number.isFinite(payload.sort) || payload.sort < 1) {
    message.error('请输入正确的排序');
    return;
  }

  try {
    createLoading.value = true;
    await createHotProductApi(payload);
    createVisible.value = false;
    message.success('新增成功');
    queryHotProducts(1);
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

async function removeHotProduct(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteHotProductApi({ id });
    hotProducts.value = hotProducts.value.filter((item) => item.id !== id);
    total.value = Math.max(total.value - 1, 0);
    message.success('删除成功');
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  Promise.all([queryCategoryMap(), queryProductOptions()]).finally(() => {
    queryHotProducts();
  });
});
</script>

<template>
  <Page title="首页热门产品">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item label="热门类型">
          <Select
            v-model:value="queryForm.hotType"
            :options="[{ label: '全部', value: '' }, ...hotTypeOptions]"
            style="width: 120px"
          />
        </Form.Item>
        <Form.Item label="关键词">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            placeholder="商品标题"
            style="width: 180px"
            @press-enter="queryHotProducts(1)"
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
        <Button :loading="queryLoading" @click="queryHotProducts(1)">
          查询
        </Button>
        <Button @click="resetQuery">重置</Button>
        <Button type="primary" @click="openCreate">新增热门产品</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="hotProducts"
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
            <Popconfirm
              title="确定删除？"
              @confirm="() => removeHotProduct(record.id)"
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
        <template v-else-if="column.key === 'cover'">
          <AntImage
            v-if="record.cover"
            :height="48"
            :src="resolveImageUrl(record.cover)"
            :width="48"
            class="hot-product-cover"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof HotProduct] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增热门产品"
      width="560px"
      @ok="createHotProduct"
    >
      <Form layout="vertical">
        <Form.Item label="产品" required>
          <Select
            v-model:value="createForm.productId"
            :loading="productLoading"
            :options="productOptions"
            option-filter-prop="label"
            placeholder="请选择产品"
            show-search
          />
        </Form.Item>
        <Form.Item label="热门类型" required>
          <Select
            v-model:value="createForm.hotType"
            :options="hotTypeOptions"
            placeholder="请选择热门类型"
          />
        </Form.Item>
        <Form.Item label="排序" required>
          <InputNumber
            v-model:value="createForm.sort"
            :min="1"
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
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.hot-product-cover {
  object-fit: cover;
  border-radius: 4px;
}
</style>
