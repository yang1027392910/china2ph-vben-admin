<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

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
} from 'ant-design-vue';

import {
  createHotProductApi,
  deleteHotProductApi,
  getCategoryListApi,
  getHotProductListApi,
  getProductListApi,
} from '#/api';
import { $t } from '#/locales';

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

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

const statusOptions = computed(() => ([
  { label: $t('app.all'), value: '' },
  { label: $t('app.enable'), value: '1' },
  { label: $t('app.disable'), value: '0' },
]));

const hotTypeOptions = [
  { label: 'today', value: 'today' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'new_alert', value: 'new_alert' },
];

const columns = computed(() => ([
  { title: $t('app.featuredType'), dataIndex: 'hotType', key: 'hotType', width: 120 },
  { title: $t('app.sortOrder'), dataIndex: 'sort', key: 'sort', width: 80 },
  { title: $t('app.productId'), dataIndex: 'productId', key: 'productId', width: 100 },
  {
    title: $t('app.category2'),
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 140,
  },
  { title: $t('app.productTitle'), dataIndex: 'title', key: 'title', width: 260 },
  { title: $t('app.cover'), dataIndex: 'cover', key: 'cover', width: 88 },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 80 },
  { title: $t('app.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: $t('app.actions'), key: 'actions', width: 100 },
]));

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
        (categoryId ? $t('app.categoryValue', { value1: categoryId }) : ''),
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
      label: item.title ? `${item.title} (ID: ${item.id})` : $t('app.productValue', { value1: item.id }),
      title: item.title ?? '',
      value: Number(item.id),
    }))
    .filter((item: ProductOption) => Number.isFinite(item.value));
}

function normalizeCategoryMap(data: any) {
  const map: Record<number, string> = {};
  for (const item of normalizeList(data)) {
    const id = Number(item.id);
    if (Number.isFinite(id)) {
      map[id] = item.name ?? item.title ?? '';
    }
  }
  return map;
}

function buildProductMap(products: ProductOption[]) {
  const map: Record<number, ProductMeta> = {};
  for (const item of products) {
    map[item.value] = {
      categoryId: item.categoryId,
      cover: item.cover,
      title: item.title,
    };
  }
  return map;
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
    return `${uploadOrigin}${url}`;
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
    message.error(error?.message || $t('app.queryFailed'));
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
    message.error(error?.message || $t('app.failedToLoadProducts'));
  } finally {
    productLoading.value = false;
  }
}

async function queryCategoryMap() {
  try {
    const responseData = await getCategoryListApi({ status: '1' });
    categoryMap.value = normalizeCategoryMap(responseData);
  } catch (error: any) {
    message.error(error?.message || $t('app.failedToLoadCategories'));
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
    message.error($t('app.selectAProduct'));
    return;
  }

  if (!payload.hotType) {
    message.error($t('app.selectAFeaturedType'));
    return;
  }

  if (!Number.isFinite(payload.sort) || payload.sort < 1) {
    message.error($t('app.enterAValidSortOrder'));
    return;
  }

  try {
    createLoading.value = true;
    await createHotProductApi(payload);
    createVisible.value = false;
    message.success($t('app.createdSuccessfully'));
    queryHotProducts(1);
  } catch (error: any) {
    message.error(error?.message || $t('app.creationFailed'));
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
    message.success($t('app.deletedSuccessfully'));
  } catch (error: any) {
    message.error(error?.message || $t('app.deletionFailed'));
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
  <Page :title="$t('app.homepageFeaturedProducts')">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item :label="$t('app.featuredType')">
          <Select
            v-model:value="queryForm.hotType"
            :options="[{ label: $t('app.all'), value: '' }, ...hotTypeOptions]"
            style="width: 120px"
          />
        </Form.Item>
        <Form.Item :label="$t('app.keyword')">
          <Input
            v-model:value="queryForm.keyword"
            allow-clear
            :placeholder="$t('app.productTitle')"
            style="width: 180px"
            @press-enter="queryHotProducts(1)"
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
        <Button :loading="queryLoading" @click="queryHotProducts(1)">{{ $t('app.search') }}</Button>
        <Button @click="resetQuery">{{ $t('app.reset') }}</Button>
        <Button type="primary" @click="openCreate">{{ $t('app.addFeaturedProduct') }}</Button>
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
        showTotal: (count: number) => $t('app.valueRecords', { value1: count }),
        total,
      }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <Popconfirm
              :title="$t('app.deleteThisItem')"
              @confirm="() => removeHotProduct(record.id)"
            >
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
          {{ record.status === 1 ? $t('app.enable') : $t('app.disable') }}
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
      :title="$t('app.addFeaturedProduct')"
      width="560px"
      @ok="createHotProduct"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('app.product2')" required>
          <Select
            v-model:value="createForm.productId"
            :loading="productLoading"
            :options="productOptions"
            option-filter-prop="label"
            :placeholder="$t('app.selectAProduct')"
            show-search
          />
        </Form.Item>
        <Form.Item :label="$t('app.featuredType')" required>
          <Select
            v-model:value="createForm.hotType"
            :options="hotTypeOptions"
            :placeholder="$t('app.selectAFeaturedType')"
          />
        </Form.Item>
        <Form.Item :label="$t('app.sortOrder')" required>
          <InputNumber
            v-model:value="createForm.sort"
            :min="1"
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
