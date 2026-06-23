<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  AutoComplete,
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
  createHomeNavigationApi,
  createIconLibraryApi,
  deleteHomeNavigationApi,
  getHomeNavigationListApi,
  getIconLibraryListApi,
  updateHomeNavigationApi,
} from '#/api';

type HomeNavigation = {
  color: string;
  icon: string;
  id: number | string;
  jumpType: string;
  jumpValue: string;
  sort: number;
  status: number;
  title: string;
  value: string;
};

type HomeNavigationForm = Omit<HomeNavigation, 'id'>;

const defaultIcon = 'solar:clipboard-list-bold-duotone';

const defaultQuery = {
  page: 1,
  pageSize: 10,
  status: '',
  title: '',
};

const defaultForm: HomeNavigationForm = {
  color: '#409EFF',
  icon: defaultIcon,
  jumpType: 'path',
  jumpValue: '/order/list',
  sort: 0,
  status: 1,
  title: '待处理',
  value: '20',
};

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

const jumpTypeOptions = [
  { label: '站内路径', value: 'path' },
  { label: '外部链接', value: 'url' },
  { label: '不跳转', value: 'none' },
];

const iconOptions = ref([
  {
    label: 'solar:clipboard-list-bold-duotone',
    value: 'solar:clipboard-list-bold-duotone',
  },
  {
    label: 'solar:hand-money-bold-duotone',
    value: 'solar:hand-money-bold-duotone',
  },
  {
    label: 'solar:headphones-round-sound-bold-duotone',
    value: 'solar:headphones-round-sound-bold-duotone',
  },
  {
    label: 'solar:verified-check-bold-duotone',
    value: 'solar:verified-check-bold-duotone',
  },
]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 140 },
  { title: '数值', dataIndex: 'value', key: 'value', width: 100 },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 260 },
  { title: '颜色', dataIndex: 'color', key: 'color', width: 120 },
  { title: '跳转类型', dataIndex: 'jumpType', key: 'jumpType', width: 110 },
  { title: '跳转值', dataIndex: 'jumpValue', key: 'jumpValue', width: 180 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '操作', key: 'actions', fixed: 'right', width: 140 },
];

const navigations = ref<HomeNavigation[]>([]);
const queryForm = ref({ ...defaultQuery });
const total = ref(0);
const queryLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref<HomeNavigationForm>({ ...defaultForm });
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<HomeNavigation>({ ...defaultForm, id: '' });
const deleteLoadingId = ref<number | string>('');
const iconLoading = ref(false);
const iconCreating = ref(false);

function normalizeList(data: any) {
  return Array.isArray(data)
    ? data
    : data?.list || data?.records || data?.rows || data?.data || [];
}

function normalizeTotal(data: any, listLength: number) {
  return Number(data?.total ?? data?.pagination?.total ?? listLength);
}

function normalizeIconOptions(data: any) {
  const list = normalizeList(data);
  const values = list
    .map((item: any) =>
      typeof item === 'string'
        ? item
        : item.iconValue ??
          item.icon_value ??
          item.icon ??
          item.value ??
          item.iconName ??
          '',
    )
    .filter(Boolean);

  return [...new Set(values)].map((value) => ({
    label: value,
    value,
  }));
}

function normalizeNavigations(data: any): HomeNavigation[] {
  return normalizeList(data).map((item: any) => ({
    color: item.color ?? '#409EFF',
    icon: item.icon ?? defaultIcon,
    id: item.id,
    jumpType: item.jumpType ?? item.jump_type ?? 'path',
    jumpValue: item.jumpValue ?? item.jump_value ?? '',
    sort: Number(item.sort ?? 0),
    status: Number(item.status ?? 0),
    title: item.title ?? '',
    value: String(item.value ?? ''),
  }));
}

function buildPayload(form: HomeNavigationForm) {
  return {
    color: form.color.trim(),
    icon: form.icon,
    jumpType: form.jumpType,
    jumpValue: form.jumpType === 'none' ? '' : form.jumpValue.trim(),
    sort: Number(form.sort),
    status: Number(form.status),
    title: form.title.trim(),
    value: form.value.trim(),
  };
}

function validatePayload(payload: ReturnType<typeof buildPayload>) {
  if (!payload.title) {
    message.error('请输入标题');
    return false;
  }
  if (!payload.value) {
    message.error('请输入数值');
    return false;
  }
  if (!payload.icon) {
    message.error('请选择图标');
    return false;
  }
  if (payload.jumpType !== 'none' && !payload.jumpValue) {
    message.error('请输入跳转值');
    return false;
  }
  return true;
}

async function queryNavigations(page = queryForm.value.page) {
  try {
    queryLoading.value = true;
    queryForm.value.page = page;
    const responseData = await getHomeNavigationListApi({
      page,
      pageSize: queryForm.value.pageSize,
      status: queryForm.value.status,
      title: queryForm.value.title.trim() || undefined,
    });
    navigations.value = normalizeNavigations(responseData);
    total.value = normalizeTotal(responseData, navigations.value.length);
  } catch (error: any) {
    message.error(error?.message || '查询失败');
  } finally {
    queryLoading.value = false;
  }
}

function resetQuery() {
  queryForm.value = { ...defaultQuery };
  queryNavigations(1);
}

function handleTableChange(pagination: TableProps['pagination']) {
  if (!pagination || typeof pagination === 'boolean') {
    return;
  }
  queryForm.value.page = pagination.current ?? 1;
  queryForm.value.pageSize = pagination.pageSize ?? 10;
  queryNavigations(queryForm.value.page);
}

function openCreate() {
  createForm.value = { ...defaultForm };
  createVisible.value = true;
}

function openEdit(record: HomeNavigation) {
  editForm.value = { ...record };
  editVisible.value = true;
}

async function queryIcons() {
  try {
    iconLoading.value = true;
    const responseData = await getIconLibraryListApi();
    const options = normalizeIconOptions(responseData);
    iconOptions.value = options.length > 0
      ? options
      : [{ label: defaultIcon, value: defaultIcon }];
  } catch (error: any) {
    message.error(error?.message || '图标列表加载失败');
  } finally {
    iconLoading.value = false;
  }
}

async function addIcon(icon: string) {
  const iconName = icon.trim();

  if (!iconName) {
    message.warning('请输入 Icon 名称');
    return;
  }

  if (!iconName.includes(':')) {
    message.warning('Icon 名称格式应类似 solar:icon-name');
    return;
  }

  if (iconOptions.value.some((item) => item.value === iconName)) {
    message.info('该 Icon 已在下拉选项中');
    return;
  }

  try {
    iconCreating.value = true;
    await createIconLibraryApi({ iconValue: iconName });
    await queryIcons();
    message.success('Icon 新增成功');
  } catch (error: any) {
    message.error(error?.message || 'Icon 新增失败');
  } finally {
    iconCreating.value = false;
  }
}

async function createNavigation() {
  const payload = buildPayload(createForm.value);
  if (!validatePayload(payload)) return;

  try {
    createLoading.value = true;
    await createHomeNavigationApi(payload);
    createVisible.value = false;
    message.success('新增成功');
    queryNavigations(1);
  } catch (error: any) {
    message.error(error?.message || '新增失败');
  } finally {
    createLoading.value = false;
  }
}

async function updateNavigation() {
  const payload = buildPayload(editForm.value);
  if (!validatePayload(payload)) return;

  try {
    editLoading.value = true;
    await updateHomeNavigationApi({ ...payload, id: editForm.value.id });
    editVisible.value = false;
    message.success('更新成功');
    queryNavigations(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
}

async function removeNavigation(id: number | string) {
  try {
    deleteLoadingId.value = id;
    await deleteHomeNavigationApi(id);
    message.success('删除成功');
    queryNavigations(queryForm.value.page);
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  } finally {
    deleteLoadingId.value = '';
  }
}

onMounted(() => {
  queryNavigations();
  queryIcons();
});
</script>

<template>
  <Page title="首页导航">
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <Form layout="inline">
        <Form.Item label="标题">
          <Input
            v-model:value="queryForm.title"
            allow-clear
            placeholder="请输入标题"
            style="width: 180px"
            @press-enter="queryNavigations(1)"
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
        <Button :loading="queryLoading" @click="queryNavigations(1)">查询</Button>
        <Button @click="resetQuery">重置</Button>
        <Button type="primary" @click="openCreate">新增首页导航</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="navigations"
      :loading="queryLoading"
      :pagination="{
        current: queryForm.page,
        pageSize: queryForm.pageSize,
        showSizeChanger: true,
        showTotal: (count: number) => `共 ${count} 条`,
        total,
      }"
      :scroll="{ x: 1250 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ record, column }">
        <template v-if="column.key === 'actions'">
          <Space>
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
            <Popconfirm
              title="确定删除这条首页导航吗？"
              @confirm="() => removeNavigation(record.id)"
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
        <template v-else-if="column.key === 'icon'">
          <Space>
            <IconifyIcon :icon="record.icon" class="text-xl" />
            <span>{{ record.icon }}</span>
          </Space>
        </template>
        <template v-else-if="column.key === 'color'">
          <Space>
            <span
              class="navigation-color"
              :style="{ backgroundColor: record.color }"
            ></span>
            <span>{{ record.color }}</span>
          </Space>
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as keyof HomeNavigation] ?? '-' }}
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createVisible"
      :confirm-loading="createLoading"
      title="新增首页导航"
      width="680px"
      @ok="createNavigation"
    >
      <Form layout="vertical">
        <div class="navigation-form-grid">
          <Form.Item label="标题" required>
            <Input v-model:value="createForm.title" placeholder="待处理" />
          </Form.Item>
          <Form.Item label="数值" required>
            <Input v-model:value="createForm.value" placeholder="20" />
          </Form.Item>
          <Form.Item class="navigation-form-full" label="图标" required>
            <div class="icon-field">
              <span class="icon-preview">
                <IconifyIcon :icon="createForm.icon" />
              </span>
              <AutoComplete
                v-model:value="createForm.icon"
                :loading="iconLoading"
                :options="iconOptions"
                placeholder="输入 Icon 名称或从下拉中选择"
              >
                <template #option="{ label, value }">
                  <Space>
                    <IconifyIcon :icon="value" class="text-xl" />
                    <span>{{ label }}</span>
                  </Space>
                </template>
              </AutoComplete>
              <Button
                :loading="iconCreating"
                @click="addIcon(createForm.icon)"
              >
                增加
              </Button>
            </div>
          </Form.Item>
          <Form.Item label="跳转类型">
            <Select
              v-model:value="createForm.jumpType"
              :options="jumpTypeOptions"
            />
          </Form.Item>
          <Form.Item label="跳转值" :required="createForm.jumpType !== 'none'">
            <Input
              v-model:value="createForm.jumpValue"
              :disabled="createForm.jumpType === 'none'"
              placeholder="/order/list"
            />
          </Form.Item>
          <Form.Item label="颜色">
            <div class="color-field">
              <input v-model="createForm.color" type="color" />
              <Input v-model:value="createForm.color" />
            </div>
          </Form.Item>
          <Form.Item label="排序">
            <InputNumber
              v-model:value="createForm.sort"
              :min="0"
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
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="editLoading"
      title="编辑首页导航"
      width="680px"
      @ok="updateNavigation"
    >
      <Form layout="vertical">
        <div class="navigation-form-grid">
          <Form.Item label="标题" required>
            <Input v-model:value="editForm.title" />
          </Form.Item>
          <Form.Item label="数值" required>
            <Input v-model:value="editForm.value" />
          </Form.Item>
          <Form.Item class="navigation-form-full" label="图标" required>
            <div class="icon-field">
              <span class="icon-preview">
                <IconifyIcon :icon="editForm.icon" />
              </span>
              <AutoComplete
                v-model:value="editForm.icon"
                :loading="iconLoading"
                :options="iconOptions"
                placeholder="输入 Icon 名称或从下拉中选择"
              >
                <template #option="{ label, value }">
                  <Space>
                    <IconifyIcon :icon="value" class="text-xl" />
                    <span>{{ label }}</span>
                  </Space>
                </template>
              </AutoComplete>
              <Button :loading="iconCreating" @click="addIcon(editForm.icon)">
                增加
              </Button>
            </div>
          </Form.Item>
          <Form.Item label="跳转类型">
            <Select
              v-model:value="editForm.jumpType"
              :options="jumpTypeOptions"
            />
          </Form.Item>
          <Form.Item label="跳转值" :required="editForm.jumpType !== 'none'">
            <Input
              v-model:value="editForm.jumpValue"
              :disabled="editForm.jumpType === 'none'"
            />
          </Form.Item>
          <Form.Item label="颜色">
            <div class="color-field">
              <input v-model="editForm.color" type="color" />
              <Input v-model:value="editForm.color" />
            </div>
          </Form.Item>
          <Form.Item label="排序">
            <InputNumber
              v-model:value="editForm.sort"
              :min="0"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="启用">
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
.navigation-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.navigation-form-full {
  grid-column: 1 / -1;
}

.icon-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
}

.icon-preview {
  display: flex;
  width: 32px;
  height: 32px;
  font-size: 20px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.navigation-color {
  width: 18px;
  height: 18px;
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 4px;
}

.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-field input[type='color'] {
  width: 40px;
  height: 32px;
  padding: 2px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .navigation-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
