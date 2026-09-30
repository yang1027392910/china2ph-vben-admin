<script setup lang="ts">
import { computed } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';

import { $t } from '#/locales';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('app.accountPassword'),
      description: $t('app.receiveMessagesFromOtherUsersAsInAppNotifications'),
    },
    {
      value: true,
      fieldName: 'systemMessage',
      label: $t('app.systemMessages'),
      description: $t('app.receiveSystemMessagesAsInAppNotifications'),
    },
    {
      value: true,
      fieldName: 'todoTask',
      label: $t('app.tasks2'),
      description: $t('app.receiveTaskRemindersAsInAppNotifications'),
    },
  ];
});
</script>
<template>
  <ProfileNotificationSetting :form-schema="formSchema" />
</template>
