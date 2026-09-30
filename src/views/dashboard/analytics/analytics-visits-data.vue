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
    legend: {
      bottom: 0,
      data: [$t('app.visits'), $t('app.trend')],
    },
    radar: {
      indicator: [
        {
          name: $t('app.web'),
        },
        {
          name: $t('app.mobile'),
        },
        {
          name: 'Ipad',
        },
        {
          name: $t('app.desktop'),
        },
        {
          name: $t('app.thirdParty'),
        },
        {
          name: $t('app.other'),
        },
      ],
      radius: '60%',
      splitNumber: 8,
    },
    series: [
      {
        areaStyle: {
          opacity: 1,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,.2)',
          shadowOffsetX: 0,
          shadowOffsetY: 10,
        },
        data: [
          {
            itemStyle: {
              color: '#b6a2de',
            },
            name: $t('app.visits'),
            value: [90, 50, 86, 40, 50, 20],
          },
          {
            itemStyle: {
              color: '#5ab1ef',
            },
            name: $t('app.trend'),
            value: [70, 75, 70, 76, 20, 85],
          },
        ],
        itemStyle: {
          // borderColor: '#fff',
          borderRadius: 10,
          borderWidth: 2,
        },
        symbolSize: 0,
        type: 'radar',
      },
    ],
    tooltip: {},
  });
}
onMounted(renderChart);
watch(() => i18n.global.locale.value, renderChart);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
