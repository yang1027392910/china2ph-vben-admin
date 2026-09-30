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
  Tag,
} from 'ant-design-vue';

import {
  approveOrderPaymentApi,
  getOrderDetailApi,
  getOrderListApi,
  updateOrderApi,
  updateOrderItemApi,
} from '#/api/core/order';
import { $t } from '#/locales';

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
const approving = ref(false);
const form = ref({ status: '', deliveryType: '', remark: '' });
const quantityOpen = ref(false);
const quantitySaving = ref(false);
const selectedItem = ref<OrderApi.Item>();
const quantity = ref<number | undefined>(1);

const columns = computed<TableColumnsType<OrderApi.Order>>(() => ([
  { title: $t('app.orderId'), dataIndex: 'id', key: 'id', width: 100 },
  { title: $t('app.orderNumber'), key: 'orderNo', width: 200 },
  { title: $t('app.username'), key: 'userName', width: 120 },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 100 },
  { title: $t('app.paymentStatus'), key: 'paymentStatus', width: 120 },
  { title: $t('app.paymentMethod'), key: 'paymentMethod', width: 120 },
  { title: $t('app.orderAmount'), key: 'totalAmount', width: 130 },
  { title: $t('app.deliveryMethod'), key: 'deliveryType', width: 130 },
  { title: $t('app.remarks'), dataIndex: 'remark', key: 'remark', width: 200 },
  { title: $t('app.createdAt'), key: 'createdAt', width: 180 },
  { title: $t('app.actions'), key: 'actions', fixed: 'right', width: 100 },
]));
const itemColumns = computed<TableColumnsType<OrderApi.Item>>(() => ([
  { title: $t('app.itemId'), dataIndex: 'id', key: 'id', width: 100 },
  { title: $t('app.productName'), key: 'productName', width: 200 },
  { title: $t('app.productId2'), key: 'productId', width: 100 },
  { title: $t('app.unitPrice'), key: 'price', width: 120 },
  { title: $t('app.quantity'), dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: $t('app.subtotal'), key: 'subtotal', width: 120 },
  { title: $t('app.actions'), key: 'actions', width: 120 },
]));
const aliases: Record<string, string[]> = {
  paymentStatus: ['paymentStatus', 'payment_status'],
  paymentMethod: ['paymentMethod', 'payment_method'],
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
      return displayField(key, value);
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
const paymentMethodLabels = computed<Record<string, string>>(() => ({
  0: $t('app.none'),
  1: 'GCash',
  2: 'Maya',
}));
const paymentStatusLabels = computed<Record<string, { color: string; text: string }>>(() => ({
  0: { color: 'default', text: $t('app.unpaid') },
  1: { color: 'orange', text: $t('app.pendingApproval') },
  2: { color: 'green', text: $t('app.paid') },
}));
function paymentStatusTag(value: unknown) {
  return paymentStatusLabels.value[String(value)] ?? { color: 'default', text: display(value) };
}
function displayField(key: string, value: unknown) {
  if (key === 'paymentMethod' || key === 'payment_method') {
    return paymentMethodLabels.value[String(value)] ?? display(value);
  }
  if (key === 'status' && Number(value) === 3) return $t('app.completed');
  if (key === 'paymentStatus' || key === 'payment_status') {
    return paymentStatusTag(value).text;
  }
  return display(value);
}
const paymentPendingApproval = computed(
  () => Number(detail.value?.paymentStatus ?? detail.value?.payment_status) === 1,
);
async function approvePayment() {
  if (!detail.value || approving.value || !paymentPendingApproval.value) return;
  const orderId = detail.value.id;
  approving.value = true;
  try {
    await approveOrderPaymentApi({ orderId });
    if (detail.value?.id === orderId) {
      const paymentKey = 'paymentStatus' in detail.value ? 'paymentStatus' : 'payment_status';
      detail.value = { ...detail.value, [paymentKey]: 2, status: 3 };
    }
    message.success($t('app.paymentApprovedPaidCompleted'));
    await Promise.all([
      selectedId.value === orderId ? fetchDetail() : Promise.resolve(),
      fetchOrders(),
    ]);
  } catch {
    // The shared interceptor reports errors; allow retry without changing status.
  } finally {
    approving.value = false;
  }
}
const labels = computed<Record<string, string>>(() => ({
  paymentMethod: $t('app.paymentMethod'),
  payment_method: $t('app.paymentMethod'),
  paymentStatus: $t('app.paymentStatus'),
  payment_status: $t('app.paymentStatus'),
  id: $t('app.orderId'),
  orderNo: $t('app.orderNumber'),
  order_no: $t('app.orderNumber'),
  userName: $t('app.username'),
  user_name: $t('app.username'),
  status: $t('app.status'),
  totalAmount: $t('app.orderAmount'),
  total_amount: $t('app.orderAmount'),
  deliveryType: $t('app.deliveryMethod'),
  delivery_type: $t('app.deliveryMethod'),
  remark: $t('app.remarks'),
  createdAt: $t('app.createdAt'),
  created_at: $t('app.createdAt'),
  updatedAt: $t('app.updatedAt'),
  updated_at: $t('app.updatedAt'),
}));
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
    if (!Array.isArray(list)) throw new Error($t('app.unexpectedOrderListResponseFormat'));
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
      message.warning($t('app.statusIsRequired'));
      return;
    }
    payload.status = preserveType(status, original.status);
  }
  if (deliveryType !== String(originalDelivery ?? '')) {
    if (!deliveryType) {
      message.warning($t('app.deliveryMethodIsRequired'));
      return;
    }
    payload.deliveryType = preserveType(deliveryType, originalDelivery);
  }
  if (form.value.remark !== (original.remark ?? ''))
    payload.remark = form.value.remark;
  if (Object.keys(payload).length === 1) {
    message.info($t('app.changeAtLeastOneField'));
    return;
  }
  saving.value = true;
  try {
    await updateOrderApi(payload);
    editing.value = false;
    message.success($t('app.orderUpdated'));
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
    message.warning($t('app.quantityMustBeAPositiveInteger'));
    return;
  }
  quantitySaving.value = true;
  try {
    await updateOrderItemApi({
      id: selectedItem.value.id,
      quantity: Number(quantity.value),
    });
    quantityOpen.value = false;
    message.success($t('app.quantityUpdated'));
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
  <Page :title="$t('app.orderManagement')" :description="$t('app.searchOrdersViewItemsAndEditOrderDetails')">
    <Form
      layout="inline"
      class="mb-4 flex flex-wrap gap-y-3"
      :model="query"
      @finish="fetchOrders(1)"
    >
      <Form.Item :label="$t('app.keyword')">
<Input
          v-model:value="query.keyword"
          allow-clear
          :placeholder="$t('app.searchOrders')"
      />
</Form.Item>
      <Form.Item :label="$t('app.username')">
<Input
          v-model:value="query.userName"
          allow-clear
          :placeholder="$t('app.enterAUsername')"
      />
</Form.Item>
      <Form.Item :label="$t('app.status')">
<Input
          v-model:value="query.status"
          allow-clear
          :placeholder="$t('app.enterAStatusValue')"
      />
</Form.Item>
      <Form.Item>
<Space>
<Button type="primary" html-type="submit" :loading="loading">{{ $t('app.search') }}</Button><Button @click="resetQuery">{{ $t('app.reset') }}</Button>
</Space>
</Form.Item>
    </Form>
    <Alert
      v-if="listError"
      type="error"
      show-icon
      :message="$t('app.failedToLoadOrdersPleaseTryAgain')"
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
        showTotal: (count: number) => $t('app.valueRecords', { value1: count }),
      }"
      @change="changePage"
    >
      <template #bodyCell="{ record, column }">
        <Button
          v-if="column.key === 'actions'"
          type="link"
          @click="openDetail(record as OrderApi.Order)"
          >
{{ Number(record.paymentStatus ?? record.payment_status) === 1 ? $t('app.reviewPayment') : $t('app.viewDetails') }}
</Button>
        <Tag
          v-else-if="column.key === 'paymentStatus'"
          :color="paymentStatusTag(record.paymentStatus ?? record.payment_status).color"
        >
          {{ paymentStatusTag(record.paymentStatus ?? record.payment_status).text }}
        </Tag>
        <template v-else>{{ cell(record, String(column.key)) }}</template>
      </template>
    </Table>
    <Drawer
      v-model:open="detailOpen"
      :title="$t('app.orderDetails')"
      width="min(100vw, 1000px)"
      :mask-closable="!saving && !quantitySaving && !approving"
    >
      <Spin :spinning="detailLoading">
        <template v-if="detail">
          <div class="mb-4 flex items-center justify-between">
                        <span class="text-lg font-medium">{{ $t('app.orderInformation') }}</span>
            <Space>
              <Button
                type="primary"
                v-if="paymentPendingApproval"
                :loading="approving"
                :disabled="saving || quantitySaving"
                @click="approvePayment"
              >
                {{ $t('app.approve') }}
              </Button>
              <Button :disabled="approving" @click="openEdit">{{ $t('app.editOrder') }}</Button>
            </Space>
          </div>
          <Descriptions bordered :column="{ xs: 1, sm: 2 }" size="small">
            <Descriptions.Item
              v-for="[key, value] in detailFields"
              :key="key"
              :label="labels[key] ?? key"
              >
              <Tag
                v-if="key === 'paymentStatus' || key === 'payment_status'"
                :color="paymentStatusTag(value).color"
              >
                {{ paymentStatusTag(value).text }}
              </Tag>
              <template v-else>{{ displayField(key, value) }}</template>
</Descriptions.Item>
          </Descriptions>
          <h3 class="mb-3 mt-6 text-lg font-medium">{{ $t('app.orderItems') }}</h3>
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
                :disabled="approving || record.id === undefined || record.id === null"
                @click="openQuantity(record as OrderApi.Item)"
                >
{{ $t('app.editQuantity') }}
</Button>
              <template v-else>{{ cell(record, String(column.key)) }}</template>
            </template>
          </Table>
        </template>
        <Empty v-else-if="!detailLoading" :description="$t('app.failedToLoadOrderDetails')">
<Button @click="fetchDetail">{{ $t('app.retry') }}</Button>
</Empty>
      </Spin>
    </Drawer>
    <Modal
      v-model:open="editing"
      :title="$t('app.editOrder')"
      :confirm-loading="saving"
      :closable="!saving"
      :mask-closable="!saving"
      :keyboard="!saving"
      :cancel-button-props="{ disabled: saving }"
      @ok="saveOrder"
    >
      <Form layout="vertical" :disabled="saving">
        <Form.Item :label="$t('app.status')">
<Input v-model:value="form.status" :placeholder="$t('app.enterAStatusValue')" />
</Form.Item>
        <Form.Item :label="$t('app.deliveryMethod')">
<Input
            v-model:value="form.deliveryType"
            :placeholder="$t('app.enterADeliveryMethodValue')"
        />
</Form.Item>
        <Form.Item :label="$t('app.remarks')">
<Input.TextArea v-model:value="form.remark" :rows="4" allow-clear />
</Form.Item>
      </Form>
    </Modal>
    <Modal
      v-model:open="quantityOpen"
      :title="$t('app.editItemQuantity')"
      :confirm-loading="quantitySaving"
      :closable="!quantitySaving"
      :mask-closable="!quantitySaving"
      :keyboard="!quantitySaving"
      :cancel-button-props="{ disabled: quantitySaving }"
      @ok="saveQuantity"
    >
      <p class="mb-4">{{ $t('app.itemIdValueSavingWillRecalculateTheOrderAmount', { value1: selectedItem?.id }) }}</p>
      <Form layout="vertical">
<Form.Item :label="$t('app.itemQuantity')" required>
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
