<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { CouponApi } from '#/api/core/coupon';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  disableCouponApi,
  getCouponConfigsApi,
  getCouponDetailApi,
  getCouponListApi,
  sendCouponApi,
  updateCouponConfigApi,
} from '#/api/core/coupon';

const typeLabels = { 1: '注册奖励', 2: '认证奖励', 3: '系统派发' };
const statusLabels = {
  0: '未解锁',
  1: '可使用',
  2: '已使用',
  3: '已过期',
  4: '已禁用',
};
const sourceLabels = { 1: '系统自动发放', 2: '管理员派发' };
const statusColors = {
  0: 'purple',
  1: 'green',
  2: 'blue',
  3: 'orange',
  4: 'default',
};
const options = (labels: Record<number, string>) =>
  Object.entries(labels).map(([value, label]) => ({
    value: Number(value),
    label,
  }));
const activeTab = ref('config');
const configs = ref<CouponApi.Config[]>([]);
const configLoading = ref(false);
const configError = ref(false);
const editOpen = ref(false);
const editId = ref<number>();
const editType = ref<1 | 2>(1);
const editForm = ref<{
  amount: null | string;
  enabled: boolean;
  validDays: null | number;
}>({ amount: '', validDays: 30, enabled: true });
const saving = ref(false);
const sendOpen = ref(false);
const sending = ref(false);
const sendForm = ref<{
  amount: null | string;
  remark: string;
  userId: null | number;
  validDays: null | number;
}>({ amount: '', remark: '', userId: null, validDays: 30 });
const query = ref<CouponApi.ListQuery>({ page: 1, pageSize: 10 });
const dates = ref<[Dayjs, Dayjs]>();
const rows = ref<CouponApi.Coupon[]>([]);
const total = ref(0);
const loading = ref(false);
const listError = ref(false);
let listRequest = 0;
const detailOpen = ref(false);
const detailId = ref<number>();
const detail = ref<CouponApi.Coupon>();
const detailLoading = ref(false);
let detailRequest = 0;
const disabling = ref<number>();
const timeFields = [
  { key: 'activatedAt', title: '激活时间' },
  { key: 'expiredAt', title: '到期时间' },
  { key: 'usedAt', title: '使用时间' },
  { key: 'createdAt', title: '创建时间' },
  { key: 'updatedAt', title: '更新时间' },
] as const;
const columns: TableColumnsType<CouponApi.Coupon> = [
  { title: '券 ID', dataIndex: 'id', width: 100 },
  { title: '用户 ID', dataIndex: 'userId', width: 100 },
  { title: '邮箱 / 昵称', key: 'user', width: 230 },
  { title: '类型', key: 'type', width: 120 },
  { title: '金额', key: 'amount', width: 130 },
  { title: '状态', key: 'status', width: 100 },
  { title: '来源', key: 'source', width: 140 },
  ...timeFields
    .filter((item) => item.key !== 'updatedAt')
    .map((item) => ({ title: item.title, dataIndex: item.key, width: 180 })),
  { title: '操作', key: 'actions', width: 150, fixed: 'right' },
];
function display(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : value;
}
function avatarUrl(url: string) {
  if (/^(https?:\/\/|data:|blob:)/.test(url)) return url;
  if (url.startsWith('/uploads'))
    return `${import.meta.env.VITE_UPLOAD_ORIGIN || ''}${url}`;
  return url.startsWith('/') ? url : `/${url}`;
}
async function loadConfigs() {
  configLoading.value = true;
  configError.value = false;
  try {
    configs.value = await getCouponConfigsApi();
  } catch {
    configError.value = true;
    configs.value = [];
  } finally {
    configLoading.value = false;
  }
}
function openEdit(config: CouponApi.Config) {
  editId.value = config.id;
  editType.value = config.type;
  editForm.value = {
    amount: config.amount,
    validDays: config.validDays,
    enabled: config.enabled,
  };
  editOpen.value = true;
}
function validReward(
  amount: null | string,
  days: null | number,
  allowZero: boolean,
) {
  if (
    amount === null ||
    !/^\d+(\.\d{1,2})?$/.test(amount) ||
    Number(amount) > 99_999_999.99 ||
    (allowZero ? Number(amount) < 0 : Number(amount) <= 0)
  ) {
    message.warning(
      `金额须${allowZero ? '大于等于' : '大于'} 0，最多两位小数，最大 99999999.99`,
    );
    return false;
  }
  if (days === null || !Number.isInteger(days) || days < 1 || days > 365_000) {
    message.warning('有效天数须为 1～365000 的整数');
    return false;
  }
  return true;
}
async function saveConfig() {
  if (saving.value || editId.value === undefined) return;
  const form = editForm.value;
  if (!validReward(form.amount, form.validDays, true)) return;
  saving.value = true;
  try {
    await updateCouponConfigApi(editId.value, {
      amount: form.amount!,
      validDays: form.validDays!,
      enabled: form.enabled,
    });
    editOpen.value = false;
    message.success('奖励配置已保存');
    await loadConfigs();
  } catch {
    /* The shared interceptor reports the backend message. */
  } finally {
    saving.value = false;
  }
}
async function loadList(page = query.value.page ?? 1) {
  if (
    dates.value &&
    (!dates.value[0]?.isValid() ||
      !dates.value[1]?.isValid() ||
      dates.value[0].isAfter(dates.value[1], 'day'))
  ) {
    message.warning('请选择正确的创建日期范围');
    return;
  }
  query.value.page = page;
  const params: CouponApi.ListQuery = { page, pageSize: query.value.pageSize };
  const keyword = query.value.keyword?.trim();
  if (keyword) params.keyword = keyword;
  for (const key of ['type', 'status', 'source'] as const) {
    const value = query.value[key];
    if (value !== undefined && value !== null)
      Object.assign(params, { [key]: value });
  }
  if (dates.value) {
    params.startDate = dates.value[0].format('YYYY-MM-DD');
    params.endDate = dates.value[1].format('YYYY-MM-DD');
  }
  const request = ++listRequest;
  loading.value = true;
  listError.value = false;
  try {
    const result = await getCouponListApi(params);
    if (request !== listRequest) return;
    rows.value = result.list;
    total.value = result.total;
    query.value.page = result.page;
    query.value.pageSize = result.pageSize;
  } catch {
    if (request === listRequest) {
      listError.value = true;
      rows.value = [];
      total.value = 0;
    }
  } finally {
    if (request === listRequest) loading.value = false;
  }
}
function resetQuery() {
  query.value = { page: 1, pageSize: 10 };
  dates.value = undefined;
  void loadList(1);
}
const handleTableChange: TableProps<CouponApi.Coupon>['onChange'] = (
  pagination,
) => {
  const sizeChanged = query.value.pageSize !== pagination.pageSize;
  query.value.pageSize = Math.min(pagination.pageSize ?? 10, 100);
  void loadList(sizeChanged ? 1 : (pagination.current ?? 1));
};
async function loadDetail(id: number) {
  const request = ++detailRequest;
  detailId.value = id;
  detailOpen.value = true;
  detail.value = undefined;
  detailLoading.value = true;
  try {
    const result = await getCouponDetailApi(id);
    if (request === detailRequest) detail.value = result;
  } catch {
    /* The drawer provides a retry; errors are reported centrally. */
  } finally {
    if (request === detailRequest) detailLoading.value = false;
  }
}
function openSend() {
  sendForm.value = { amount: '', remark: '', userId: null, validDays: 30 };
  sendOpen.value = true;
}
async function sendCoupon() {
  if (sending.value) return;
  const form = sendForm.value;
  if (
    form.userId === null ||
    !Number.isSafeInteger(form.userId) ||
    form.userId <= 0
  ) {
    message.warning('请输入有效的用户 ID（正整数）');
    return;
  }
  if (!validReward(form.amount, form.validDays, false)) return;
  if (form.remark.length > 255) {
    message.warning('备注最多 255 个字符');
    return;
  }
  sending.value = true;
  try {
    await sendCouponApi({
      userId: form.userId,
      amount: form.amount!,
      validDays: form.validDays!,
      ...(form.remark ? { remark: form.remark } : {}),
    });
    sendOpen.value = false;
    message.success('优惠券已派发');
    activeTab.value = 'users';
    await loadList(1);
  } catch {
    /* Never retry a send automatically. */
  } finally {
    sending.value = false;
  }
}
async function disableCoupon(coupon: CouponApi.Coupon) {
  if (disabling.value !== undefined || ![0, 1].includes(coupon.status)) return;
  disabling.value = coupon.id;
  try {
    await disableCouponApi(coupon.id);
    message.success('优惠券已禁用');
  } catch {
    /* Refresh even if the coupon expired or was used before the request. */
  } finally {
    await Promise.all([
      loadList(),
      ...(detailOpen.value && detailId.value === coupon.id
        ? [loadDetail(coupon.id)]
        : []),
    ]);
    disabling.value = undefined;
  }
}
onMounted(() => {
  void loadConfigs();
  void loadList();
});
</script>

<template>
  <Page title="优惠券管理" description="管理注册、认证奖励配置及用户优惠券">
    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="config" tab="奖励配置">
        <Alert class="mb-4" type="info" show-icon message="奖励配置说明">
          <template #description>
            <div>
              调整金额不会改变已发放优惠券的面额；关闭配置停止生成对应的新奖励券。
            </div>
            <div>
              已发放的认证奖励券仍可在认证通过后解锁；认证券有效期从解锁时开始，使用当时配置的有效天数。
            </div>
          </template>
        </Alert>
        <Spin :spinning="configLoading">
          <Empty v-if="configError" description="奖励配置加载失败"
            ><Button @click="loadConfigs">重新加载</Button></Empty
          >
          <Empty
            v-else-if="!configLoading && configs.length === 0"
            description="暂无奖励配置"
          />
          <div class="grid gap-4 lg:grid-cols-2">
            <Card
              v-for="config in configs"
              :key="config.id"
              :title="typeLabels[config.type]"
            >
              <template #extra
                ><Tag :color="config.enabled ? 'green' : 'default'">{{
                  config.enabled ? '已启用' : '已关闭'
                }}</Tag></template
              >
              <Descriptions :column="1">
                <Descriptions.Item label="奖励类型">{{
                  typeLabels[config.type]
                }}</Descriptions.Item>
                <Descriptions.Item label="金额"
                  ><span class="text-2xl font-semibold"
                    >₱{{ config.amount }}</span
                  ></Descriptions.Item
                >
                <Descriptions.Item label="有效天数"
                  >{{ config.validDays }} 天</Descriptions.Item
                >
              </Descriptions>
              <Button type="primary" @click="openEdit(config)">编辑配置</Button>
            </Card>
          </div>
        </Spin>
      </Tabs.TabPane>
      <Tabs.TabPane key="users" tab="用户优惠券">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <Input
            v-model:value="query.keyword"
            class="w-60"
            placeholder="用户 ID、邮箱或昵称"
            allow-clear
            @change="query.page = 1"
            @press-enter="loadList(1)"
          />
          <Select
            v-model:value="query.type"
            class="w-36"
            :options="options(typeLabels)"
            placeholder="全部类型"
            allow-clear
            @change="loadList(1)"
          />
          <Select
            v-model:value="query.status"
            class="w-36"
            :options="options(statusLabels)"
            placeholder="全部状态"
            allow-clear
            @change="loadList(1)"
          />
          <Select
            v-model:value="query.source"
            class="w-40"
            :options="options(sourceLabels)"
            placeholder="全部来源"
            allow-clear
            @change="loadList(1)"
          />
          <DatePicker.RangePicker
            v-model:value="dates"
            :placeholder="['创建开始日期', '创建结束日期']"
            format="YYYY-MM-DD"
            @change="loadList(1)"
          />
          <Space
            ><Button :loading="loading" @click="loadList(1)">搜索</Button
            ><Button @click="resetQuery">重置</Button
            ><Button type="primary" @click="openSend">派发优惠券</Button></Space
          >
        </div>
        <Alert
          v-if="listError"
          class="mb-4"
          type="error"
          message="优惠券列表加载失败"
          show-icon
          ><template #action
            ><Button size="small" @click="loadList()"
              >重新加载</Button
            ></template
          ></Alert
        >
        <Table
          :columns="columns"
          :data-source="rows"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1890 }"
          :pagination="{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (count: number) => `共 ${count} 条`,
          }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ record, column, text }">
            <template v-if="column.key === 'user'"
              ><div>{{ display(record.email) }}</div>
              <div class="text-sm text-muted-foreground">
                {{ display(record.nickname) }}
              </div></template
            >
            <template v-else-if="column.key === 'type'">{{
              typeLabels[record.type as CouponApi.Type]
            }}</template>
            <template v-else-if="column.key === 'source'">{{
              sourceLabels[record.source as CouponApi.Source]
            }}</template>
            <template v-else-if="column.key === 'amount'"
              >₱{{ record.amount }}</template
            >
            <template v-else-if="column.key === 'status'"
              ><Tag :color="statusColors[record.status as CouponApi.Status]">{{
                statusLabels[record.status as CouponApi.Status]
              }}</Tag></template
            >
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button size="small" type="link" @click="loadDetail(record.id)"
                  >详情</Button
                >
                <Popconfirm
                  v-if="record.status === 0 || record.status === 1"
                  title="确定禁用该优惠券吗？禁用后用户将无法使用。"
                  :disabled="disabling !== undefined"
                  @confirm="disableCoupon(record)"
                  ><Button
                    size="small"
                    type="link"
                    danger
                    :disabled="disabling !== undefined"
                    :loading="disabling === record.id"
                    >禁用</Button
                  ></Popconfirm
                >
              </Space>
            </template>
            <template v-else>{{ display(text) }}</template>
          </template>
        </Table>
      </Tabs.TabPane>
    </Tabs>
    <Modal
      v-model:open="editOpen"
      title="编辑奖励配置"
      :confirm-loading="saving"
      :closable="!saving"
      :mask-closable="!saving"
      :keyboard="!saving"
      :cancel-button-props="{ disabled: saving }"
      @ok="saveConfig"
    >
      <Form layout="vertical" :disabled="saving">
        <Form.Item label="奖励类型"
          ><Input :value="typeLabels[editType]" disabled
        /></Form.Item>
        <Form.Item label="金额（₱）" required
          ><InputNumber
            v-model:value="editForm.amount"
            string-mode
            :min="0"
            :max="99999999.99"
            :step="0.01"
            class="w-full"
        /></Form.Item>
        <Form.Item label="有效天数" required
          ><InputNumber
            v-model:value="editForm.validDays"
            :min="1"
            :max="365000"
            class="w-full"
        /></Form.Item>
        <Form.Item label="启用状态" required
          ><Switch v-model:checked="editForm.enabled"
        /></Form.Item>
      </Form>
    </Modal>
    <Modal
      v-model:open="sendOpen"
      title="派发优惠券"
      ok-text="确认派发"
      :confirm-loading="sending"
      :closable="!sending"
      :mask-closable="!sending"
      :keyboard="!sending"
      :cancel-button-props="{ disabled: sending }"
      @ok="sendCoupon"
    >
      <Alert
        class="mb-4"
        type="info"
        show-icon
        message="派发后立即生效，有效期从派发时间开始计算。同一用户可拥有多张管理员派发券。"
      />
      <Form layout="vertical" :disabled="sending">
        <Form.Item label="用户 ID" required
          ><InputNumber
            v-model:value="sendForm.userId"
            :min="1"
            :max="Number.MAX_SAFE_INTEGER"
            class="w-full"
            placeholder="请输入已存在的用户 ID"
        /></Form.Item>
        <Form.Item label="金额（₱）" required
          ><InputNumber
            v-model:value="sendForm.amount"
            string-mode
            :min="0.01"
            :max="99999999.99"
            :step="0.01"
            class="w-full"
        /></Form.Item>
        <Form.Item label="有效天数" required
          ><InputNumber
            v-model:value="sendForm.validDays"
            :min="1"
            :max="365000"
            class="w-full"
        /></Form.Item>
        <Form.Item label="备注"
          ><Input.TextArea
            v-model:value="sendForm.remark"
            :maxlength="255"
            show-count
            :rows="3"
        /></Form.Item>
      </Form>
    </Modal>
    <Drawer
      v-model:open="detailOpen"
      title="优惠券详情"
      width="min(640px, 100vw)"
    >
      <Spin :spinning="detailLoading">
        <Descriptions v-if="detail" :column="1" bordered>
          <Descriptions.Item label="券 ID">{{ detail.id }}</Descriptions.Item>
          <Descriptions.Item label="类型">{{
            typeLabels[detail.type]
          }}</Descriptions.Item>
          <Descriptions.Item label="金额"
            >₱{{ detail.amount }}</Descriptions.Item
          >
          <Descriptions.Item label="状态"
            ><Tag :color="statusColors[detail.status]">{{
              statusLabels[detail.status]
            }}</Tag></Descriptions.Item
          >
          <Descriptions.Item label="用户头像"
            ><Avatar
              v-if="detail.avatar"
              :src="avatarUrl(detail.avatar)"
              :size="48"
            /><span v-else>—</span></Descriptions.Item
          >
          <Descriptions.Item label="用户 ID">{{
            detail.userId
          }}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{{
            display(detail.email)
          }}</Descriptions.Item>
          <Descriptions.Item label="昵称">{{
            display(detail.nickname)
          }}</Descriptions.Item>
          <Descriptions.Item label="来源">{{
            sourceLabels[detail.source]
          }}</Descriptions.Item>
          <Descriptions.Item label="备注"
            ><span class="whitespace-pre-wrap break-all">{{
              display(detail.remark)
            }}</span></Descriptions.Item
          >
          <Descriptions.Item
            v-if="
              detail.orderId !== null &&
              detail.orderId !== undefined &&
              detail.orderId !== ''
            "
            label="关联订单 ID"
            >{{ detail.orderId }}</Descriptions.Item
          >
          <Descriptions.Item
            v-for="field in timeFields"
            :key="field.key"
            :label="field.title"
            >{{ display(detail[field.key]) }}</Descriptions.Item
          >
        </Descriptions>
        <Empty v-else-if="!detailLoading" description="优惠券详情加载失败"
          ><Button @click="detailId !== undefined && loadDetail(detailId)"
            >重新加载</Button
          ></Empty
        >
      </Spin>
    </Drawer>
  </Page>
</template>
