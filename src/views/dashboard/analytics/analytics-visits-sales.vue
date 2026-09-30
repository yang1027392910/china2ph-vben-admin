<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { i18n } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { $t } from '#/locales';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function renderChart() {
  renderEcharts({
    series: [
      {
        animationDelay() {
          return Math.random() * 400;
        },
        animationEasing: 'exponentialInOut',
        animationType: 'scale',
        center: ['50%', '50%'],
        color: ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9'],
        data: [
          { name: $t('app.outsourcing'), value: 500 },
          { name: $t('app.customization'), value: 310 },
          { name: $t('app.technicalSupport'), value: 274 },
          { name: $t('app.remoteServices'), value: 400 },
        ].toSorted((a, b) => {
          return a.value - b.value;
        }),
        name: $t('app.businessBreakdown'),
        radius: '80%',
        roseType: 'radius',
        type: 'pie',
      },
    ],

    tooltip: {
      trigger: 'item',
    },
  });
}
onMounted(renderChart);
watch(() => i18n.global.locale.value, renderChart);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
