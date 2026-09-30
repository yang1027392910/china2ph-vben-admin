<script setup lang="ts">
import { computed } from 'vue';

import { ProfileSecuritySetting } from '@vben/common-ui';

import { $t } from '#/locales';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('app.accountPassword'),
      description: $t('app.currentPasswordStrengthStrong'),
    },
    {
      value: true,
      fieldName: 'securityPhone',
      label: $t('app.recoveryPhone'),
      description: $t('app.linkedPhone1388293'),
    },
    {
      value: true,
      fieldName: 'securityQuestion',
      label: $t('app.securityQuestions'),
      description: $t('app.noSecurityQuestionsSetAddThemToHelpProtectYour'),
    },
    {
      value: true,
      fieldName: 'securityEmail',
      label: $t('app.recoveryEmail'),
      description: $t('app.linkedEmailAntSignCom'),
    },
    {
      value: false,
      fieldName: 'securityMfa',
      label: $t('app.mfaDevice'),
      description: $t('app.noMfaDeviceLinkedLinkOneToEnableTwoStep'),
    },
  ];
});
</script>
<template>
  <ProfileSecuritySetting :form-schema="formSchema" />
</template>
