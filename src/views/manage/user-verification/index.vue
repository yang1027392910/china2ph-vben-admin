<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';

import type { UserVerificationApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Image as AntImage,
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  approveUserVerificationApi,
  getUserVerificationListApi,
  rejectUserVerificationApi,
} from '#/api';
import { $t } from '#/locales';

type VerificationRecord = UserVerificationApi.VerificationRecord;
type VerificationStatus = UserVerificationApi.VerificationStatus;

const uploadOrigin = import.meta.env.VITE_UPLOAD_ORIGIN || '';

const filters = reactive({
  keyword: '',
  page: 1,
  pageSize: 10,
  status: undefined as undefined | VerificationStatus,
});

const records = ref<VerificationRecord[]>([]);
const total = ref(0);
const queryLoading = ref(false);
const reviewLoading = ref(false);
const reviewVisible = ref(false);
const reviewType = ref<'approve' | 'reject'>('approve');
const currentRecord = ref<VerificationRecord>();
const reviewRemark = ref('');
const detailVisible = ref(false);
const detailRecord = ref<VerificationRecord>();

const statusOptions = computed(() => ([
  { label: $t('app.pendingReview'), value: 0 },
  { label: $t('app.approved'), value: 1 },
  { label: $t('app.rejected'), value: 2 },
]));

const statusMap = computed<Record<VerificationStatus, { color: string; text: string }>>(() => ({
  0: { color: 'orange', text: $t('app.pendingReview') },
  1: { color: 'green', text: $t('app.approved') },
  2: { color: 'red', text: $t('app.rejected') },
}));

const columns = computed<TableColumnsType<VerificationRecord>>(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: $t('app.username'), dataIndex: 'userName', key: 'userName', width: 120 },
  { title: $t('app.name'), dataIndex: 'fullName', key: 'fullName', width: 120 },
  { title: $t('app.contactPhone'), dataIndex: 'phone', key: 'phone', width: 150 },
  { title: $t('app.email'), dataIndex: 'email', key: 'email', width: 210 },
  { title: $t('app.storeName'), dataIndex: 'shopName', key: 'shopName', width: 160 },
  {
    title: $t('app.businessType'),
    dataIndex: 'businessType',
    key: 'businessType',
    width: 130,
  },
  { title: $t('app.city'), dataIndex: 'city', key: 'city', width: 120 },
  {
    title: $t('app.storePhotos'),
    dataIndex: 'storePhotos',
    key: 'storePhotos',
    width: 110,
  },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 100 },
  { title: $t('app.reviewRemarks'), dataIndex: 'remark', key: 'remark', width: 180 },
  { title: $t('app.appliedAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: $t('app.reviewedAt'), dataIndex: 'reviewedAt', key: 'reviewedAt', width: 180 },
  { title: $t('app.actions'), key: 'actions', fixed: 'right', width: 210 },
]));

function normalizeStorePhotos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function resolveImageUrl(url: string) {
  if (/^(blob:|data:|https?:\/\/)/.test(url)) {
    return url;
  }

  if (url.startsWith('/uploads')) {
    return `${uploadOrigin}${url}`;
  }

  return url.startsWith('/') ? url : `/${url}`;
}

function normalizeRecord(item: any): VerificationRecord {
  const rawStatus = Number(item.status ?? 0);
  const status: VerificationStatus =
    rawStatus === 1 || rawStatus === 2 ? rawStatus : 0;

  return {
    address: String(item.address ?? ''),
    businessType: String(item.businessType ?? item.business_type ?? ''),
    city: String(item.city ?? ''),
    createdAt: String(item.createdAt ?? item.created_at ?? ''),
    email: String(item.email ?? ''),
    fullName: String(item.fullName ?? item.full_name ?? ''),
    id: item.id ?? '',
    phone: String(item.phone ?? ''),
    remark: String(item.remark ?? ''),
    reviewedAt: String(item.reviewedAt ?? item.reviewed_at ?? ''),
    shopName: String(item.shopName ?? item.shop_name ?? ''),
    status,
    storeDescription: String(
      item.storeDescription ?? item.store_description ?? '',
    ),
    storePhotos: normalizeStorePhotos(
      item.storePhotos ?? item.store_photos ?? [],
    ),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? ''),
    userName: String(item.userName ?? item.user_name ?? ''),
  };
}

function normalizeList(data: any): VerificationRecord[] {
  const list = Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];

  return list.map((item: any) => normalizeRecord(item));
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

async function queryRecords() {
  try {
    queryLoading.value = true;
    const responseData = await getUserVerificationListApi({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      status: filters.status,
    });
    records.value = normalizeList(responseData);
    total.value = normalizeTotal(responseData, records.value.length);
  } catch (error: any) {
    message.error(error?.message || $t('app.failedToLoadVerificationRequests'));
  } finally {
    queryLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  queryRecords();
}

function resetFilters() {
  filters.keyword = '';
  filters.page = 1;
  filters.status = undefined;
  queryRecords();
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  filters.page = pagination.current ?? 1;
  filters.pageSize = pagination.pageSize ?? 10;
  queryRecords();
}

function openDetail(record: VerificationRecord) {
  detailRecord.value = record;
  detailVisible.value = true;
}

function openReview(record: VerificationRecord, type: 'approve' | 'reject') {
  currentRecord.value = record;
  reviewType.value = type;
  reviewRemark.value = record.remark || '';
  reviewVisible.value = true;
}

async function submitReview() {
  if (!currentRecord.value) {
    return;
  }

  const remark = reviewRemark.value.trim();
  if (reviewType.value === 'reject' && !remark) {
    message.error($t('app.enterAReasonForRejection'));
    return;
  }

  try {
    reviewLoading.value = true;
    const payload = { remark: remark || undefined };

    await (reviewType.value === 'approve'
      ? approveUserVerificationApi(currentRecord.value.id, payload)
      : rejectUserVerificationApi(currentRecord.value.id, payload));

    message.success(
      reviewType.value === 'approve' ? $t('app.verificationApproved') : $t('app.applicationRejected'),
    );
    reviewVisible.value = false;
    await queryRecords();
  } catch (error: any) {
    message.error(error?.message || $t('app.reviewFailed'));
  } finally {
    reviewLoading.value = false;
  }
}

function getStatusMeta(status: VerificationStatus) {
  return statusMap.value[status];
}

onMounted(() => {
  queryRecords();
});
</script>

<template>
  <Page :title="$t('app.userVerification')" :description="$t('app.reviewStoreVerificationDocumentsSubmittedByUsers')">
    <Form class="mb-4" layout="inline">
      <Form.Item :label="$t('app.keyword')">
        <Input
          v-model:value="filters.keyword"
          allow-clear
          :placeholder="$t('app.namePhoneEmailOrStoreName')"
          @press-enter="handleSearch"
        />
      </Form.Item>
      <Form.Item :label="$t('app.reviewStatus')">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="verification-filter-select"
          :placeholder="$t('app.allStatuses')"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button :loading="queryLoading" type="primary" @click="handleSearch">{{ $t('app.search') }}</Button>
          <Button @click="resetFilters">{{ $t('app.reset') }}</Button>
        </Space>
      </Form.Item>
    </Form>

    <Table
      :columns="columns"
      :data-source="records"
      :loading="queryLoading"
      :pagination="{
        current: filters.page,
        pageSize: filters.pageSize,
        showSizeChanger: true,
        showTotal: (count: number) => $t('app.valueRecords', { value1: count }),
        total,
      }"
      :scroll="{ x: 2000 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusMeta(record.status).color">
            {{ getStatusMeta(record.status).text }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'storePhotos'">
          <AntImage.PreviewGroup v-if="record.storePhotos.length > 0">
            <Space :size="4">
              <AntImage
                v-for="photo in record.storePhotos.slice(0, 2)"
                :key="photo"
                :height="40"
                :src="resolveImageUrl(photo)"
                :width="40"
                class="store-photo"
              />
            </Space>
          </AntImage.PreviewGroup>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button
              size="small"
              type="link"
              @click="openDetail(record as VerificationRecord)"
            >
{{ $t('app.details') }}
</Button>
            <template v-if="record.status === 0">
              <Button
                size="small"
                type="link"
                @click="openReview(record as VerificationRecord, 'approve')"
              >
{{ $t('app.approve') }}
</Button>
              <Button
                danger
                size="small"
                type="link"
                @click="openReview(record as VerificationRecord, 'reject')"
              >
{{ $t('app.reject') }}
</Button>
            </template>
          </Space>
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof VerificationRecord] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="detailVisible"
      :footer="null"
      :title="$t('app.verificationRequestDetails')"
      width="760px"
    >
      <Descriptions v-if="detailRecord" :column="2" bordered>
        <Descriptions.Item :label="$t('app.applicationId')">
          {{ detailRecord.id }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.username')">
          {{ detailRecord.userName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.name')">
          {{ detailRecord.fullName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.contactPhone')">
          {{ detailRecord.phone || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.email')">
          {{ detailRecord.email || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.city')">
          {{ detailRecord.city || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" :label="$t('app.address')">
          {{ detailRecord.address || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.storeName')">
          {{ detailRecord.shopName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.businessType')">
          {{ detailRecord.businessType || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" :label="$t('app.mainProducts')">
          {{ detailRecord.storeDescription || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" :label="$t('app.storePhotos')">
          <AntImage.PreviewGroup v-if="detailRecord.storePhotos.length > 0">
            <Space wrap>
              <AntImage
                v-for="photo in detailRecord.storePhotos"
                :key="photo"
                :height="88"
                :src="resolveImageUrl(photo)"
                :width="88"
                class="store-photo"
              />
            </Space>
          </AntImage.PreviewGroup>
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.reviewStatus')">
          <Tag :color="getStatusMeta(detailRecord.status).color">
            {{ getStatusMeta(detailRecord.status).text }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.reviewedAt')">
          {{ detailRecord.reviewedAt || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" :label="$t('app.reviewRemarks')">
          {{ detailRecord.remark || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.appliedAt')">
          {{ detailRecord.createdAt || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('app.updatedAt')">
          {{ detailRecord.updatedAt || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </Modal>

    <Modal
      v-model:open="reviewVisible"
      :confirm-loading="reviewLoading"
      :ok-button-props="{ danger: reviewType === 'reject' }"
      :ok-text="reviewType === 'approve' ? $t('app.confirmApproval') : $t('app.confirmRejection')"
      :title="reviewType === 'approve' ? $t('app.approveVerificationRequest') : $t('app.rejectVerificationRequest')"
      @ok="submitReview"
    >
      <Form layout="vertical">
        <Form.Item
          :label="reviewType === 'approve' ? $t('app.reviewRemarks') : $t('app.rejectionReason')"
          :required="reviewType === 'reject'"
        >
          <Input.TextArea
            v-model:value="reviewRemark"
            :maxlength="255"
            :rows="4"
            :placeholder="$t('app.enterReviewRemarks')"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.verification-filter-select {
  width: 150px;
}

.store-photo {
  object-fit: cover;
  border-radius: 4px;
}
</style>
