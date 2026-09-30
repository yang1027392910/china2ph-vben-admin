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
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2 %',
    },
    series: [
      {
        barMaxWidth: 80,
        // color: '#4f69fd',
        data: [
          3000, 2000, 3333, 5000, 3200, 4200, 3200, 2100, 3000, 5100, 6000,
          3200, 4800,
        ],
        type: 'bar',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          // color: '#4f69fd',
          width: 1,
        },
      },
      trigger: 'axis',
    },
    xAxis: {
      data: Array.from({ length: 12 }).map((_item, index) => $t('app.monthValue', { value1: index + 1 })),
      type: 'category',
    },
    yAxis: {
      max: 8000,
      splitNumber: 4,
      type: 'value',
    },
  });
}
onMounted(renderChart);
watch(() => i18n.global.locale.value, renderChart);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
