<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';

import type { UserVerificationApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';

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

const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: 2 },
];

const statusMap: Record<VerificationStatus, { color: string; text: string }> = {
  0: { color: 'orange', text: '待审核' },
  1: { color: 'green', text: '已通过' },
  2: { color: 'red', text: '已拒绝' },
};

const columns: TableColumnsType<VerificationRecord> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
  { title: '姓名', dataIndex: 'fullName', key: 'fullName', width: 120 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 150 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 210 },
  { title: '店铺名称', dataIndex: 'shopName', key: 'shopName', width: 160 },
  {
    title: '经营类型',
    dataIndex: 'businessType',
    key: 'businessType',
    width: 130,
  },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  {
    title: '店铺照片',
    dataIndex: 'storePhotos',
    key: 'storePhotos',
    width: 110,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '审核备注', dataIndex: 'remark', key: 'remark', width: 180 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '审核时间', dataIndex: 'reviewedAt', key: 'reviewedAt', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right', width: 210 },
];

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
    userId: item.userId ?? item.user_id ?? '',
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
    message.error(error?.message || '用户认证列表加载失败');
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
    message.error('请填写拒绝原因');
    return;
  }

  try {
    reviewLoading.value = true;
    const payload = { remark: remark || undefined };

    await (reviewType.value === 'approve'
      ? approveUserVerificationApi(currentRecord.value.id, payload)
      : rejectUserVerificationApi(currentRecord.value.id, payload));

    message.success(
      reviewType.value === 'approve' ? '审核已通过' : '已拒绝申请',
    );
    reviewVisible.value = false;
    await queryRecords();
  } catch (error: any) {
    message.error(error?.message || '审核操作失败');
  } finally {
    reviewLoading.value = false;
  }
}

function getStatusMeta(status: VerificationStatus) {
  return statusMap[status];
}

onMounted(() => {
  queryRecords();
});
</script>

<template>
  <Page title="用户认证管理" description="审核用户提交的店铺认证资料">
    <Form class="mb-4" layout="inline">
      <Form.Item label="关键词">
        <Input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="姓名、电话、邮箱或店铺名称"
          @press-enter="handleSearch"
        />
      </Form.Item>
      <Form.Item label="审核状态">
        <Select
          v-model:value="filters.status"
          :options="statusOptions"
          allow-clear
          class="verification-filter-select"
          placeholder="全部状态"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button :loading="queryLoading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button @click="resetFilters">重置</Button>
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
        showTotal: (count: number) => `共 ${count} 条`,
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
              详情
            </Button>
            <template v-if="record.status === 0">
              <Button
                size="small"
                type="link"
                @click="openReview(record as VerificationRecord, 'approve')"
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="openReview(record as VerificationRecord, 'reject')"
              >
                拒绝
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
      title="认证申请详情"
      width="760px"
    >
      <Descriptions v-if="detailRecord" :column="2" bordered>
        <Descriptions.Item label="申请ID">
          {{ detailRecord.id }}
        </Descriptions.Item>
        <Descriptions.Item label="用户ID">
          {{ detailRecord.userId }}
        </Descriptions.Item>
        <Descriptions.Item label="姓名">
          {{ detailRecord.fullName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="联系电话">
          {{ detailRecord.phone || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="邮箱">
          {{ detailRecord.email || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="城市">
          {{ detailRecord.city || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="地址">
          {{ detailRecord.address || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="店铺名称">
          {{ detailRecord.shopName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="经营类型">
          {{ detailRecord.businessType || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="主营产品">
          {{ detailRecord.storeDescription || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="店铺照片">
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
        <Descriptions.Item label="审核状态">
          <Tag :color="getStatusMeta(detailRecord.status).color">
            {{ getStatusMeta(detailRecord.status).text }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="审核时间">
          {{ detailRecord.reviewedAt || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="审核备注">
          {{ detailRecord.remark || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="申请时间">
          {{ detailRecord.createdAt || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {{ detailRecord.updatedAt || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </Modal>

    <Modal
      v-model:open="reviewVisible"
      :confirm-loading="reviewLoading"
      :ok-button-props="{ danger: reviewType === 'reject' }"
      :ok-text="reviewType === 'approve' ? '确认通过' : '确认拒绝'"
      :title="reviewType === 'approve' ? '通过认证申请' : '拒绝认证申请'"
      @ok="submitReview"
    >
      <Form layout="vertical">
        <Form.Item
          :label="reviewType === 'approve' ? '审核备注' : '拒绝原因'"
          :required="reviewType === 'reject'"
        >
          <Input.TextArea
            v-model:value="reviewRemark"
            :maxlength="255"
            :rows="4"
            placeholder="请输入审核备注"
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
