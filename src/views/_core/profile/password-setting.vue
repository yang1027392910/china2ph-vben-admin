<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { $t } from '#/locales';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: $t('app.currentPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('app.enterYourCurrentPassword'),
      },
    },
    {
      fieldName: 'newPassword',
      label: $t('app.newPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('app.enterANewPassword'),
      },
    },
    {
      fieldName: 'confirmPassword',
      label: $t('app.confirmPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('app.enterYourNewPasswordAgain'),
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: $t('app.enterYourNewPasswordAgain') })
            .min(1, { message: $t('app.enterYourNewPasswordAgain') })
            .refine((value) => value === newPassword, {
              message: $t('app.passwordsDoNotMatch'),
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

function handleSubmit() {
  message.success($t('app.passwordChanged'));
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
