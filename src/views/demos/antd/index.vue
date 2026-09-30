<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Button, Card, message, notification, Space } from 'ant-design-vue';

import { $t } from '#/locales';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

function info() {
  message.info('How many roads must a man walk down');
}

function error() {
  message.error({
    content: 'Once upon a time you dressed so fine',
    duration: 2500,
  });
}

function warning() {
  message.warning('How many roads must a man walk down');
}
function success() {
  message.success('Cause you walked hand in hand With another man in my place');
}

function notify(type: NotificationType) {
  notification[type]({
    duration: 2500,
    message: $t('app.saySomething'),
    type,
  });
}
</script>

<template>
  <Page
    :description="$t('app.includesLanguageSwitchingAndThemeControls')"
    :title="$t('app.antDesignVueComponentExamples')"
  >
    <Card class="mb-5" :title="$t('app.button')">
      <Space>
        <Button>Default</Button>
        <Button type="primary"> Primary </Button>
        <Button> Info </Button>
        <Button danger> Error </Button>
      </Space>
    </Card>
    <Card class="mb-5" title="Message">
      <Space>
        <Button @click="info">{{ $t('app.information') }}</Button>
        <Button danger @click="error">{{ $t('app.error') }}</Button>
        <Button @click="warning">{{ $t('app.warning') }}</Button>
        <Button @click="success">{{ $t('app.success') }}</Button>
      </Space>
    </Card>

    <Card class="mb-5" title="Notification">
      <Space>
        <Button @click="notify('info')">{{ $t('app.information') }}</Button>
        <Button danger @click="notify('error')">{{ $t('app.error') }}</Button>
        <Button @click="notify('warning')">{{ $t('app.warning') }}</Button>
        <Button @click="notify('success')">{{ $t('app.success') }}</Button>
      </Space>
    </Card>
  </Page>
</template>
