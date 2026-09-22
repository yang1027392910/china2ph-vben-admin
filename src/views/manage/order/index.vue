<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';

import type { OrderApi } from '#/api/core/order';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Spin,
  Table,
} from 'ant-design-vue';

import {
  getOrderDetailApi,
  getOrderListApi,
  updateOrderApi,
  updateOrderItemApi,
} from '#/api/core/order';

const defaults = { keyword: '', status: '', userName: '', page: 1, pageSize: 10 };
const query = ref({ ...defaults });
const orders = ref<OrderApi.Order[]>([]);
const total = ref(0);
const loading = ref(false);
const listError = ref(false);
let listRequest = 0;
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<OrderApi.Order>();
const selectedId = ref<OrderApi.Id>();
let detailRequest = 0;
const editing = ref(false);
const saving = ref(false);
const form = ref({ status: '', deliveryType: '', remark: '' });
const quantityOpen = ref(false);
const quantitySaving = ref(false);
const selectedItem = ref<OrderApi.Item>();
const quantity = ref<number | undefined>(1);

const columns: TableColumnsType<OrderApi.Order> = [
  { title: '订单 ID', dataIndex: 'id', key: 'id', width: 100 },
  { title: '订单编号', key: 'orderNo', width: 200 },
  { title: '用户名', key: 'userName', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '订单金额', key: 'totalAmount', width: 130 },
  { title: '配送方式', key: 'deliveryType', width: 130 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 200 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right', width: 100 },
];
const itemColumns: TableColumnsType<OrderApi.Item> = [
  { title: '明细 ID', dataIndex: 'id', key: 'id', width: 100 },
  { title: '商品名称', key: 'productName', width: 200 },
  { title: '商品 ID', key: 'productId', width: 100 },
  { title: '单价', key: 'price', width: 120 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: '小计', key: 'subtotal', width: 120 },
  { title: '操作', key: 'actions', width: 120 },
];
const aliases: Record<string, string[]> = {
  orderNo: ['orderNo', 'order_no', 'orderNumber'],
  userName: ['userName', 'user_name', 'username'],
  totalAmount: ['totalAmount', 'total_amount', 'amount'],
  deliveryType: ['deliveryType', 'delivery_type'],
  createdAt: ['createdAt', 'created_at'],
  productName: ['productName', 'product_name', 'name', 'title'],
  productId: ['productId', 'product_id'],
  price: ['price', 'unitPrice', 'unit_price'],
  subtotal: ['subtotal', 'totalAmount', 'total_amount', 'amount'],
};
function cell(record: Record<string, unknown>, key: string) {
  for (const field of aliases[key] ?? [key]) {
    const value = record[field];
    if (value !== undefined && value !== null && value !== '')
      return String(value);
  }
  return '-';
}
const items = computed(() => {
  const value =
    detail.value?.items ??
    detail.value?.orderItems ??
    detail.value?.order_items;
  return Array.isArray(value) ? (value as OrderApi.Item[]) : [];
});
const detailFields = computed(() =>
  Object.entries(detail.value ?? {}).filter(
    ([, value]) => !Array.isArray(value),
  ),
);
function display(value: unknown) {
  return value === null || value === undefined || value === ''
    ? '-'
    : (typeof value === 'object'
      ? JSON.stringify(value)
      : String(value));
}
const labels: Record<string, string> = {
  id: '订单 ID',
  orderNo: '订单编号',
  order_no: '订单编号',
  userName: '用户名',
  user_name: '用户名',
  status: '状态',
  totalAmount: '订单金额',
  total_amount: '订单金额',
  deliveryType: '配送方式',
  delivery_type: '配送方式',
  remark: '备注',
  createdAt: '创建时间',
  created_at: '创建时间',
  updatedAt: '更新时间',
  updated_at: '更新时间',
};
async function fetchOrders(page = query.value.page) {
  const request = ++listRequest;
  query.value.page = page;
  loading.value = true;
  listError.value = false;
  try {
    const { keyword, status, userName, pageSize } = query.value;
    const data = await getOrderListApi({
      page,
      pageSize,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status.trim() ? { status: status.trim() } : {}),
      ...(userName.trim() ? { userName: userName.trim() } : {}),
    });
    if (request !== listRequest) return;
    const list = Array.isArray(data)
      ? data
      : (data.list ?? data.records ?? data.rows);
    if (!Array.isArray(list)) throw new Error('订单列表返回格式不符合预期');
    orders.value = list;
    total.value = Array.isArray(data)
      ? list.length
      : Number(data.total ?? data.pagination?.total ?? list.length);
  } catch {
    if (request === listRequest) {
      orders.value = [];
      total.value = 0;
      listError.value = true;
    }
  } finally {
    if (request === listRequest) loading.value = false;
  }
}
function resetQuery() {
  query.value = { ...defaults };
  void fetchOrders(1);
}
const changePage: TableProps['onChange'] = (pagination) => {
  const sizeChanged = query.value.pageSize !== pagination.pageSize;
  query.value.pageSize = pagination.pageSize ?? 10;
  void fetchOrders(sizeChanged ? 1 : (pagination.current ?? 1));
};
async function fetchDetail() {
  const id = selectedId.value;
  if (id === undefined) return;
  const request = ++detailRequest;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    const data = await getOrderDetailApi(id);
    if (request === detailRequest) detail.value = data;
  } catch {
    // Request errors are reported by the shared interceptor; the drawer offers retry.
  } finally {
    if (request === detailRequest) detailLoading.value = false;
  }
}
function openDetail(order: OrderApi.Order) {
  selectedId.value = order.id;
  detailOpen.value = true;
  void fetchDetail();
}
function openEdit() {
  if (!detail.value) return;
  form.value = {
    status: String(detail.value.status ?? ''),
    deliveryType: String(
      detail.value.deliveryType ?? detail.value.delivery_type ?? '',
    ),
    remark: detail.value.remark ?? '',
  };
  editing.value = true;
}
function preserveType(value: string, original: unknown) {
  return typeof original === 'number' && Number.isFinite(Number(value))
    ? Number(value)
    : value;
}
async function saveOrder() {
  if (!detail.value || saving.value) return;
  const original = detail.value;
  const payload: OrderApi.Update = { id: original.id };
  const status = form.value.status.trim();
  const deliveryType = form.value.deliveryType.trim();
  const originalDelivery = original.deliveryType ?? original.delivery_type;
  if (status !== String(original.status ?? '')) {
    if (!status) {
      message.warning('状态不能为空');
      return;
    }
    payload.status = preserveType(status, original.status);
  }
  if (deliveryType !== String(originalDelivery ?? '')) {
    if (!deliveryType) {
      message.warning('配送方式不能为空');
      return;
    }
    payload.deliveryType = preserveType(deliveryType, originalDelivery);
  }
  if (form.value.remark !== (original.remark ?? ''))
    payload.remark = form.value.remark;
  if (Object.keys(payload).length === 1) {
    message.info('请至少修改一项内容');
    return;
  }
  saving.value = true;
  try {
    await updateOrderApi(payload);
    editing.value = false;
    message.success('订单已更新');
    await Promise.all([fetchDetail(), fetchOrders()]);
  } catch {
    // Keep the form open so the user can correct or retry the update.
  } finally {
    saving.value = false;
  }
}
function openQuantity(item: OrderApi.Item) {
  selectedItem.value = item;
  quantity.value = Number(item.quantity);
  quantityOpen.value = true;
}
async function saveQuantity() {
  if (!selectedItem.value || quantitySaving.value) return;
  if (!Number.isSafeInteger(quantity.value) || Number(quantity.value) <= 0) {
    message.warning('商品数量必须为正整数');
    return;
  }
  quantitySaving.value = true;
  try {
    await updateOrderItemApi({
      id: selectedItem.value.id,
      quantity: Number(quantity.value),
    });
    quantityOpen.value = false;
    message.success('商品数量已更新');
    await Promise.all([fetchDetail(), fetchOrders()]);
  } catch {
    // Keep the input available for retry.
  } finally {
    quantitySaving.value = false;
  }
}
onMounted(() => {
  void fetchOrders();
});
</script>

<template>
  <Page title="订单管理" description="查询订单、查看商品明细及修改订单信息">
    <Form
      layout="inline"
      class="mb-4 flex flex-wrap gap-y-3"
      :model="query"
      @finish="fetchOrders(1)"
    >
      <Form.Item label="关键词">
<Input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索订单"
      />
</Form.Item>
      <Form.Item label="用户名">
<Input
          v-model:value="query.userName"
          allow-clear
          placeholder="请输入用户名"
      />
</Form.Item>
      <Form.Item label="状态">
<Input
          v-model:value="query.status"
          allow-clear
          placeholder="请输入状态值"
      />
</Form.Item>
      <Form.Item>
<Space>
<Button type="primary" html-type="submit" :loading="loading">
查询
</Button><Button @click="resetQuery">重置</Button>
</Space>
</Form.Item>
    </Form>
    <Alert
      v-if="listError"
      type="error"
      show-icon
      message="订单加载失败，请重新查询"
      class="mb-4"
    />
    <Table
      :columns="columns"
      :data-source="orders"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1260 }"
      :pagination="{
        current: query.page,
        pageSize: query.pageSize,
        total,
        showSizeChanger: true,
        showTotal: (count: number) => `共 ${count} 条`,
      }"
      @change="changePage"
    >
      <template #bodyCell="{ record, column }">
        <Button
          v-if="column.key === 'actions'"
          type="link"
          @click="openDetail(record as OrderApi.Order)"
          >
查看详情
</Button>
        <template v-else>{{ cell(record, String(column.key)) }}</template>
      </template>
    </Table>
    <Drawer
      v-model:open="detailOpen"
      title="订单详情"
      width="min(100vw, 1000px)"
      :mask-closable="!saving && !quantitySaving"
    >
      <Spin :spinning="detailLoading">
        <template v-if="detail">
          <div class="mb-4 flex items-center justify-between">
            <span class="text-lg font-medium">订单信息</span><Button type="primary" @click="openEdit">编辑订单</Button>
          </div>
          <Descriptions bordered :column="{ xs: 1, sm: 2 }" size="small">
            <Descriptions.Item
              v-for="[key, value] in detailFields"
              :key="key"
              :label="labels[key] ?? key"
              >
{{ display(value) }}
</Descriptions.Item>
          </Descriptions>
          <h3 class="mb-3 mt-6 text-lg font-medium">商品明细</h3>
          <Table
            :columns="itemColumns"
            :data-source="items"
            row-key="id"
            :pagination="false"
            :scroll="{ x: 860 }"
          >
            <template #bodyCell="{ record, column }">
              <Button
                v-if="column.key === 'actions'"
                type="link"
                :disabled="record.id === undefined || record.id === null"
                @click="openQuantity(record as OrderApi.Item)"
                >
修改数量
</Button>
              <template v-else>{{ cell(record, String(column.key)) }}</template>
            </template>
          </Table>
        </template>
        <Empty v-else-if="!detailLoading" description="订单详情加载失败">
<Button @click="fetchDetail">重试</Button>
</Empty>
      </Spin>
    </Drawer>
    <Modal
      v-model:open="editing"
      title="编辑订单"
      :confirm-loading="saving"
      :closable="!saving"
      :mask-closable="!saving"
      :keyboard="!saving"
      :cancel-button-props="{ disabled: saving }"
      @ok="saveOrder"
    >
      <Form layout="vertical" :disabled="saving">
        <Form.Item label="状态">
<Input v-model:value="form.status" placeholder="请输入状态值" />
</Form.Item>
        <Form.Item label="配送方式">
<Input
            v-model:value="form.deliveryType"
            placeholder="请输入配送方式值"
        />
</Form.Item>
        <Form.Item label="备注">
<Input.TextArea v-model:value="form.remark" :rows="4" allow-clear />
</Form.Item>
      </Form>
    </Modal>
    <Modal
      v-model:open="quantityOpen"
      title="修改商品数量"
      :confirm-loading="quantitySaving"
      :closable="!quantitySaving"
      :mask-closable="!quantitySaving"
      :keyboard="!quantitySaving"
      :cancel-button-props="{ disabled: quantitySaving }"
      @ok="saveQuantity"
    >
      <p class="mb-4">
        明细 ID：{{ selectedItem?.id }}。保存后将重新计算订单金额。
      </p>
      <Form layout="vertical">
<Form.Item label="商品数量" required>
<InputNumber
            v-model:value="quantity"
            :min="1"
            :max="Number.MAX_SAFE_INTEGER"
            :step="1"
            :disabled="quantitySaving"
            class="w-full"
/>
</Form.Item>
</Form>
    </Modal>
  </Page>
</template>
