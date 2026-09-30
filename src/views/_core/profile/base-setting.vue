<script setup lang="ts">
import type { BasicOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';

import { getUserInfoApi } from '#/api';
import { $t } from '#/locales';

const profileBaseSettingRef = ref();

const MOCK_ROLES_OPTIONS = computed<BasicOption[]>(() => ([
  {
    label: $t('app.administrator'),
    value: 'super',
  },
  {
    label: $t('app.user'),
    value: 'user',
  },
  {
    label: $t('app.test'),
    value: 'test',
  },
]));

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'realName',
      component: 'Input',
      label: $t('app.name'),
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: $t('app.username'),
    },
    {
      fieldName: 'roles',
      component: 'Select',
      componentProps: {
        mode: 'tags',
        options: MOCK_ROLES_OPTIONS.value,
      },
      label: $t('app.roles'),
    },
    {
      fieldName: 'introduction',
      component: 'Textarea',
      label: $t('app.bio'),
    },
  ];
});

onMounted(async () => {
  const data = await getUserInfoApi();
  profileBaseSettingRef.value.getFormApi().setValues(data);
});
</script>
<template>
  <ProfileBaseSetting ref="profileBaseSettingRef" :form-schema="formSchema" />
</template>
