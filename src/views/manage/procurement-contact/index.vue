<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
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
  createProcurementContactApi,
  deleteProcurementContactApi,
  getProcurementContactListApi,
  updateProcurementContactApi,
} from '#/api';
import { $t } from '#/locales';

type ProcurementContact = {
  contactType: string;
  contactValue: string;
  createdAt?: string;
  description: string;
  id: number | string;
  sort: number;
  status: number;
  updatedAt?: string;
};

type ProcurementContactForm = Omit<
  ProcurementContact,
  'createdAt' | 'id' | 'updatedAt'
>;

const defaultQuery = {
  contactType: '',
  page: 1,
  pageSize: 10,
  status: '1',
};

const defaultForm: ProcurementContactForm = {
  contactType: 'messenger',
  contactValue: '',
  description: '',
  sort: 1,
  status: 1,
};

const statusOptions = computed(() => ([
  { label: $t('app.all'), value: '' },
  { label: $t('app.enable'), value: '1' },
  { label: $t('app.disable'), value: '0' },
]));

const contactTypeOptions = [
  { label: 'Messenger', value: 'messenger' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
];

const columns = computed(() => ([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
  {
    title: $t('app.contactMethod'),
    dataIndex: 'contactType',
    key: 'contactType',
    width: 130,
  },
  {
    title: $t('app.contactValue'),
    dataIndex: 'contactValue',
    key: 'contactValue',
    width: 220,
  },
  { title: $t('app.description'), dataIndex: 'description', key: 'description', width: 240 },
  { title: $t('app.sortOrder'), dataIndex: 'sort', key: 'sort', width: 80 },
  { title: $t('app.status'), dataIndex: 'status', key: 'status', width: 80 },
  { title: $t('app.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: $t('app.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: $t('app.actions'), key: 'actions', width: 140 },
]));

const contacts = ref<ProcurementContact[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<ProcurementContactForm>({ ...defaultForm });
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<ProcurementContact>({
  ...defaultForm,
  createdAt: '',
  id: '',
  updatedAt: '',
});
const deleteLoadingId = ref<number | string>('');

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeContacts(data: any): ProcurementContact[] {
  return normalizeList(data).map((item: any) => ({
    contactType: item.contactType ?? item.contact_type ?? '',
    contactValue: item.contactValue ?? item.contact_value ?? '',
    createdAt: item.createdAt ?? item.created_at ?? '',
    description: item.description ?? '',
    id: item.id,
    sort: Number(item.sort ?? 0),
    status: Number(item.status ?? 0),
    updatedAt: item.updatedAt ?? item.updated_at ?? '',
  }));
}

function buildPayload(form: ProcurementContactForm) {
  return {
    contact_type: form.contactType.trim(),
    contact_value: form.contactValue.trim(),
    description: form.description.trim(),
    sort: Number(form.sort),
    status: Number(form.status),
  };
}

async function queryContacts(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getProcurementContactListApi({
      contactType: queryForm.value.contactType || undefined,
      page: queryForm.value.page,
      pageSize: queryForm.value.pageSize,
      status: queryForm.value.status,
    });

    contacts.value = normalizeContacts(responseData);
    total.value = normalizeTotal(responseData, contacts.value.length);
  } catch (error: any) {
    message.error(error?.message || $t('app.queryFailed'));
  } finally {
    queryLoading.value = false;
  }
}

function resetQuery() {
  queryForm.value = { ...defaultQuery };
  queryContacts(1);
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }

  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  queryContacts(queryForm.value.page);
}

function openCreate() {
  createForm.value = { ...defaultForm };
  createVisible.value = true;
}

function openEdit(record: ProcurementContact) {
  editForm.value = { ...record };
  editVisible.value = true;
}

function validatePayload(payload: ReturnType<typeof buildPayload>) {
  if (!payload.contact_type) {
    message.error($t('app.selectAContactMethod'));
    return false;
  }

  if (!payload.contact_value) {
    message.error($t('app.enterAContactValue'));
    return false;
  }

  if (!Number.isFinite(payload.sort)) {
    message.error($t('app.enterAValidSortOrder'));
    return false;
  }

  return true;
}

async function createContact() {
  const payload = buildPayload(createForm.value);

  if (!validatePayload(payload)) {
    return;
  }

  try {
    createLoading.value = true;
    await createProcurementContactApi(payload);
    createVisible.value = false;
    message.success($t('app.createdSuccessfully'));
    queryContacts(1);
  } catch (error: any) {
    message.error(error?.message || $t('app.creationFailed'));
  } finally {
    createLoading.value = false;
  }
}

async function updateContact() {
  const payload = buildPayload(editForm.value);

  if (!validatePayload(payload)) {
    return;
  }

  try {
    editLoading.value = true;
    await updateProcurementContactApi({
      ...payload,
      id: editForm.value.id,
    });
    editVisible.value = false;
    message.success($t('app.updatedSuccessfully'));
    queryContacts(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || $t('app.updateFailed'));
  } finally {
    editLoading.value = false;
  }
}

async function removeContact(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteProcurementContactApi(id);
    contacts.value = contacts.value.filter((item) => item.id !== id);
    total.value = Math.max(total.value - 1, 0);
    message.success($t('app.deletedSuccessfully'));
  } catch (error: any) {
    message.error(error?.message || $t('app.deletionFailed'));
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  queryContacts();
});
</script>

<template>
  <Page :title="$t('app.customerSupport')">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item :label="$t('app.contactMethod')">
          <Select
            v-model:value="queryForm.contactType"
            :options="[{ label: $t('app.all'), value: '' }, ...contactTypeOptions]"
            style="width: 130px"
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
        <Button :loading="queryLoading" @click="queryContacts(1)">{{ $t('app.search') }}</Button>
        <Button @click="resetQuery">{{ $t('app.reset') }}</Button>
        <Button type="primary" @click="openCreate">{{ $t('app.addSupportContact') }}</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="contacts"
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
            <Button
              size="small"
              type="link"
              @click="openEdit(record as ProcurementContact)"
            >
{{ $t('app.edit') }}
</Button>
            <Popconfirm
              :title="$t('app.deleteThisItem')"
              @confirm="() => removeContact(record.id)"
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
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? $t('app.enable') : $t('app.disable') }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof ProcurementContact] || '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      :title="$t('app.addSupportContact')"
      width="620px"
      @ok="createContact"
    >
      <Form layout="vertical">
        <div class="contact-form-grid">
          <Form.Item :label="$t('app.contactMethod')" required>
            <Select
              v-model:value="createForm.contactType"
              :options="contactTypeOptions"
            />
          </Form.Item>
          <Form.Item :label="$t('app.contactValue')" required>
            <Input
              v-model:value="createForm.contactValue"
              :placeholder="$t('app.enterAnAccountLinkOrPhoneNumber')"
            />
          </Form.Item>
          <Form.Item class="contact-form-full" :label="$t('app.description')">
            <Input.TextArea
              v-model:value="createForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </Form.Item>
          <Form.Item :label="$t('app.sortOrder')">
            <InputNumber
              v-model:value="createForm.sort"
              :min="0"
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
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      :title="$t('app.editSupportContact')"
      width="620px"
      @ok="updateContact"
    >
      <Form layout="vertical">
        <div class="contact-form-grid">
          <Form.Item :label="$t('app.contactMethod')" required>
            <Select
              v-model:value="editForm.contactType"
              :options="contactTypeOptions"
            />
          </Form.Item>
          <Form.Item :label="$t('app.contactValue')" required>
            <Input
              v-model:value="editForm.contactValue"
              :placeholder="$t('app.enterAnAccountLinkOrPhoneNumber')"
            />
          </Form.Item>
          <Form.Item class="contact-form-full" :label="$t('app.description')">
            <Input.TextArea
              v-model:value="editForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </Form.Item>
          <Form.Item :label="$t('app.sortOrder')">
            <InputNumber
              v-model:value="editForm.sort"
              :min="0"
              class="w-full"
            />
          </Form.Item>
          <Form.Item :label="$t('app.enable')">
            <Switch
              v-model:checked="editForm.status"
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
.contact-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.contact-form-full {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .contact-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
