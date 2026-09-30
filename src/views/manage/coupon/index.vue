<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { CouponApi } from '#/api/core/coupon';

import { computed, onMounted, ref } from 'vue';

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
import { $t } from '#/locales';

const typeLabels = computed(() => ({ 1: $t('app.registrationReward'), 2: $t('app.verificationReward'), 3: $t('app.systemGrant') }));
const statusLabels = computed(() => ({
  0: $t('app.locked'),
  1: $t('app.available'),
  2: $t('app.used'),
  3: $t('app.expired'),
  4: $t('app.disabled'),
}));
const sourceLabels = computed(() => ({ 1: $t('app.automaticallyIssued'), 2: $t('app.adminGrant') }));
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
  amount: string | undefined;
  enabled: boolean;
  validDays: number | undefined;
}>({ amount: '', validDays: 30, enabled: true });
const saving = ref(false);
const sendOpen = ref(false);
const sending = ref(false);
const sendForm = ref<{
  amount: string | undefined;
  remark: string;
  userId: number | undefined;
  validDays: number | undefined;
}>({ amount: '', remark: '', userId: undefined, validDays: 30 });
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
const timeFields = computed(() => ([
  { key: 'activatedAt', title: $t('app.activatedAt') },
  { key: 'expiredAt', title: $t('app.expiresAt') },
  { key: 'usedAt', title: $t('app.usedAt') },
  { key: 'createdAt', title: $t('app.createdAt') },
  { key: 'updatedAt', title: $t('app.updatedAt') },
] as const));
const columns = computed<TableColumnsType<CouponApi.Coupon>>(() => ([
  { title: $t('app.couponId'), dataIndex: 'id', width: 100 },
  { title: $t('app.userId'), dataIndex: 'userId', width: 100 },
  { title: $t('app.emailNickname'), key: 'user', width: 230 },
  { title: $t('app.type'), key: 'type', width: 120 },
  { title: $t('app.amount'), key: 'amount', width: 130 },
  { title: $t('app.status'), key: 'status', width: 100 },
  { title: $t('app.source'), key: 'source', width: 140 },
  ...timeFields.value
    .filter((item) => item.key !== 'updatedAt')
    .map((item) => ({ title: item.title, dataIndex: item.key, width: 180 })),
  { title: $t('app.actions'), key: 'actions', width: 150, fixed: 'right' },
]));
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
  amount: null | string | undefined,
  days: null | number | undefined,
  allowZero: boolean,
) {
  if (
    amount === null ||
    amount === undefined ||
    !/^\d+(\.\d{1,2})?$/.test(amount) ||
    Number(amount) > 99_999_999.99 ||
    (allowZero ? Number(amount) < 0 : Number(amount) <= 0)
  ) {
    message.warning(
      $t('app.amountMustBeValue0HaveAtMostTwoDecimal', { value1: allowZero ? $t('app.greaterThanOrEqual') : $t('app.greaterThan') }),
    );
    return false;
  }
  if (
    days === null ||
    days === undefined ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 365_000
  ) {
    message.warning($t('app.validityMustBeAnIntegerBetween1And365000Days'));
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
    message.success($t('app.rewardSettingsSaved'));
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
    message.warning($t('app.selectAValidCreationDateRange'));
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
  sendForm.value = { amount: '', remark: '', userId: undefined, validDays: 30 };
  sendOpen.value = true;
}
async function sendCoupon() {
  if (sending.value) return;
  const form = sendForm.value;
  if (
    form.userId === null ||
    form.userId === undefined ||
    !Number.isSafeInteger(form.userId) ||
    form.userId <= 0
  ) {
    message.warning($t('app.enterAValidUserIdPositiveInteger'));
    return;
  }
  if (!validReward(form.amount, form.validDays, false)) return;
  if (form.remark.length > 255) {
    message.warning($t('app.remarksCannotExceed255Characters'));
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
    message.success($t('app.couponGranted'));
    activeTab.value = 'users';
    await loadList(1);
  } catch {
    /* Never retry a send automatically. */
  } finally {
    sending.value = false;
  }
}
async function disableCoupon(id: number, status: CouponApi.Status) {
  if (disabling.value !== undefined || ![0, 1].includes(status)) return;
  disabling.value = id;
  try {
    await disableCouponApi(id);
    message.success($t('app.couponDisabled'));
  } catch {
    /* Refresh even if the coupon expired or was used before the request. */
  } finally {
    await Promise.all([
      loadList(),
      ...(detailOpen.value && detailId.value === id ? [loadDetail(id)] : []),
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
  <Page :title="$t('app.couponManagement')" :description="$t('app.manageRegistrationAndVerificationRewardsAndUserCoupons')">
    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="config" :tab="$t('app.rewardSettings')">
        <Alert class="mb-4" type="info" show-icon :message="$t('app.aboutRewardSettings')">
          <template #description>
            <div>{{ $t('app.changingTheAmountDoesNotAffectExistingCouponsDisablingA') }}</div>
            <div>{{ $t('app.existingVerificationCouponsCanStillUnlockAfterApprovalTheirValidity') }}</div>
          </template>
        </Alert>
        <Spin :spinning="configLoading">
          <Empty v-if="configError" :description="$t('app.failedToLoadRewardSettings')">
            <Button @click="loadConfigs">{{ $t('app.reload') }}</Button>
          </Empty>
          <Empty
            v-else-if="!configLoading && configs.length === 0"
            :description="$t('app.noRewardSettings')"
          />
          <div class="grid gap-4 lg:grid-cols-2">
            <Card
              v-for="config in configs"
              :key="config.id"
              :title="typeLabels[config.type]"
            >
              <template #extra>
                <Tag :color="config.enabled ? 'green' : 'default'">
                  {{ config.enabled ? $t('app.enabled') : $t('app.off') }}
                </Tag>
              </template>
              <Descriptions :column="1">
                <Descriptions.Item :label="$t('app.rewardType')">
                  {{ typeLabels[config.type] }}
                </Descriptions.Item>
                <Descriptions.Item :label="$t('app.amount')">
                  <span class="text-2xl font-semibold">₱{{ config.amount }}</span>
                </Descriptions.Item>
                <Descriptions.Item :label="$t('app.validityInDays')">
                  {{ $t('app.valueDays', { value1: config.validDays }) }}
</Descriptions.Item>
              </Descriptions>
              <Button type="primary" @click="openEdit(config)">{{ $t('app.editSettings') }}</Button>
            </Card>
          </div>
        </Spin>
      </Tabs.TabPane>
      <Tabs.TabPane key="users" :tab="$t('app.userCoupons')">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <Input
            v-model:value="query.keyword"
            class="w-60"
            :placeholder="$t('app.userIdEmailOrNickname')"
            allow-clear
            @change="query.page = 1"
            @press-enter="loadList(1)"
          />
          <Select
            v-model:value="query.type"
            class="w-36"
            :options="options(typeLabels)"
            :placeholder="$t('app.allTypes')"
            allow-clear
            @change="loadList(1)"
          />
          <Select
            v-model:value="query.status"
            class="w-36"
            :options="options(statusLabels)"
            :placeholder="$t('app.allStatuses')"
            allow-clear
            @change="loadList(1)"
          />
          <Select
            v-model:value="query.source"
            class="w-40"
            :options="options(sourceLabels)"
            :placeholder="$t('app.allSources')"
            allow-clear
            @change="loadList(1)"
          />
          <DatePicker.RangePicker
            v-model:value="dates"
            :placeholder="[$t('app.creationStartDate'), $t('app.creationEndDate')]"
            format="YYYY-MM-DD"
            @change="loadList(1)"
          />
          <Space>
            <Button :loading="loading" @click="loadList(1)">{{ $t('app.search2') }}</Button><Button @click="resetQuery">{{ $t('app.reset') }}</Button><Button type="primary" @click="openSend">{{ $t('app.grantCoupon') }}</Button>
          </Space>
        </div>
        <Alert
          v-if="listError"
          class="mb-4"
          type="error"
          :message="$t('app.failedToLoadCoupons')"
          show-icon
        >
          <template #action>
            <Button size="small" @click="loadList()">{{ $t('app.reload') }}</Button>
          </template>
        </Alert>
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
            showTotal: (count: number) => $t('app.valueRecords', { value1: count }),
          }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ record, column, text }">
            <template v-if="column.key === 'user'">
              <div>{{ display(record.email) }}</div>
              <div class="text-sm text-muted-foreground">
                {{ display(record.nickname) }}
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              {{ typeLabels[record.type as CouponApi.Type] }}
            </template>
            <template v-else-if="column.key === 'source'">
              {{ sourceLabels[record.source as CouponApi.Source] }}
            </template>
            <template v-else-if="column.key === 'amount'">
              ₱{{ record.amount }}
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="statusColors[record.status as CouponApi.Status]">
                {{ statusLabels[record.status as CouponApi.Status] }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button size="small" type="link" @click="loadDetail(record.id)">{{ $t('app.details') }}</Button>
                <Popconfirm
                  v-if="record.status === 0 || record.status === 1"
                  :title="$t('app.disableThisCouponTheUserWillNoLongerBeAble')"
                  :disabled="disabling !== undefined"
                  @confirm="disableCoupon(record.id, record.status)"
                >
                  <Button
                    size="small"
                    type="link"
                    danger
                    :disabled="disabling !== undefined"
                    :loading="disabling === record.id"
                  >
{{ $t('app.disable') }}
</Button>
                </Popconfirm>
              </Space>
            </template>
            <template v-else>{{ display(text) }}</template>
          </template>
        </Table>
      </Tabs.TabPane>
    </Tabs>
    <Modal
      v-model:open="editOpen"
      :title="$t('app.editRewardSettings')"
      :confirm-loading="saving"
      :closable="!saving"
      :mask-closable="!saving"
      :keyboard="!saving"
      :cancel-button-props="{ disabled: saving }"
      @ok="saveConfig"
    >
      <Form layout="vertical" :disabled="saving">
        <Form.Item :label="$t('app.rewardType')">
          <Input :value="typeLabels[editType]" disabled />
        </Form.Item>
        <Form.Item :label="$t('app.amount2')" required>
          <InputNumber
            v-model:value="editForm.amount"
            string-mode
            :min="0"
            :max="99999999.99"
            :step="0.01"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.validityInDays')" required>
          <InputNumber
            v-model:value="editForm.validDays"
            :min="1"
            :max="365000"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.enabledStatus')" required>
          <Switch v-model:checked="editForm.enabled" />
        </Form.Item>
      </Form>
    </Modal>
    <Modal
      v-model:open="sendOpen"
      :title="$t('app.grantCoupon')"
      :ok-text="$t('app.confirmGrant')"
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
        :message="$t('app.theCouponBecomesAvailableImmediatelyAndItsValidityStartsWhen')"
      />
      <Form layout="vertical" :disabled="sending">
        <Form.Item :label="$t('app.userId')" required>
          <InputNumber
            v-model:value="sendForm.userId"
            :min="1"
            :max="Number.MAX_SAFE_INTEGER"
            class="w-full"
            :placeholder="$t('app.enterAnExistingUserId')"
          />
        </Form.Item>
        <Form.Item :label="$t('app.amount2')" required>
          <InputNumber
            v-model:value="sendForm.amount"
            string-mode
            :min="0.01"
            :max="99999999.99"
            :step="0.01"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.validityInDays')" required>
          <InputNumber
            v-model:value="sendForm.validDays"
            :min="1"
            :max="365000"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('app.remarks')">
          <Input.TextArea
            v-model:value="sendForm.remark"
            :maxlength="255"
            show-count
            :rows="3"
          />
        </Form.Item>
      </Form>
    </Modal>
    <Drawer
      v-model:open="detailOpen"
      :title="$t('app.couponDetails')"
      width="min(640px, 100vw)"
    >
      <Spin :spinning="detailLoading">
        <Descriptions v-if="detail" :column="1" bordered>
          <Descriptions.Item :label="$t('app.couponId')">{{ detail.id }}</Descriptions.Item>
          <Descriptions.Item :label="$t('app.type')">
            {{ typeLabels[detail.type] }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.amount')">
            ₱{{ detail.amount }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.status')">
            <Tag :color="statusColors[detail.status]">
              {{ statusLabels[detail.status] }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.userAvatar')">
            <Avatar
              v-if="detail.avatar"
              :src="avatarUrl(detail.avatar)"
              :size="48"
            /><span v-else>—</span>
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.userId')">
            {{ detail.userId }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.email')">
            {{ display(detail.email) }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.nickname')">
            {{ display(detail.nickname) }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.source')">
            {{ sourceLabels[detail.source] }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('app.remarks')">
            <span class="whitespace-pre-wrap break-all">{{
              display(detail.remark)
            }}</span>
          </Descriptions.Item>
          <Descriptions.Item
            v-if="
              detail.orderId !== null &&
              detail.orderId !== undefined &&
              detail.orderId !== ''
            "
            :label="$t('app.linkedOrderId')"
          >
            {{ detail.orderId }}
          </Descriptions.Item>
          <Descriptions.Item
            v-for="field in timeFields"
            :key="field.key"
            :label="field.title"
          >
            {{ display(detail[field.key]) }}
          </Descriptions.Item>
        </Descriptions>
        <Empty v-else-if="!detailLoading" :description="$t('app.failedToLoadCouponDetails')">
          <Button @click="detailId !== undefined && loadDetail(detailId)">{{ $t('app.reload') }}</Button>
        </Empty>
      </Spin>
    </Drawer>
  </Page>
</template>
