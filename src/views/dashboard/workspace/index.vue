<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { $t } from '#/locales';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

// 这是一个示例数据，实际项目中需要根据实际情况进行调整
// url 也可以是内部路由，在 navTo 方法中识别处理，进行内部跳转
// 例如：url: /dashboard/workspace
const projectItems = computed<WorkbenchProjectItem[]>(() => ([
  {
    color: '',
    content: $t('app.doNotWaitForOpportunitiesCreateThem'),
    date: '2021-04-01',
    group: $t('app.openSourceTeam'),
    icon: 'carbon:logo-github',
    title: 'Github',
    url: 'https://github.com',
  },
  {
    color: '#3fb27f',
    content: $t('app.whoYouAreTodayShapesWhoYouWillBeTomorrow'),
    date: '2021-04-01',
    group: $t('app.algorithmsTeam'),
    icon: 'ion:logo-vue',
    title: 'Vue',
    url: 'https://vuejs.org',
  },
  {
    color: '#e18525',
    content: $t('app.noTalentMattersMoreThanHardWork'),
    date: '2021-04-01',
    group: $t('app.breakRoom'),
    icon: 'ion:logo-html5',
    title: 'Html5',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML',
  },
  {
    color: '#bf0c2c',
    content: $t('app.passionAndDeterminationCanOvercomeAnyObstacle'),
    date: '2021-04-01',
    group: 'UI',
    icon: 'ion:logo-angular',
    title: 'Angular',
    url: 'https://angular.io',
  },
  {
    color: '#00d8ff',
    content: $t('app.goodHealthIsTheFoundationForAchievingYourGoals'),
    date: '2021-04-01',
    group: $t('app.techExperts'),
    icon: 'bx:bxl-react',
    title: 'React',
    url: 'https://reactjs.org',
  },
  {
    color: '#EBD94E',
    content: $t('app.progressComesFromTakingActionNotJustImaginingIt'),
    date: '2021-04-01',
    group: $t('app.architectureTeam'),
    icon: 'ion:logo-javascript',
    title: 'Js',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
  },
]));

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => ([
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: $t('app.home'),
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: $t('app.dashboard'),
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: $t('app.components'),
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: $t('app.systemManagement'),
    url: '/demos/features/login-expired', // 这里的 URL 是示例，实际项目中需要根据实际情况进行调整
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: $t('app.accessManagement'),
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: $t('app.charts'),
    url: '/analytics',
  },
]));

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    get content() { return $t('app.reviewRecentFrontendCommitsInGitForCodeQualityAnd'); },
    date: '2024-07-30 11:00:00',
    get title() { return $t('app.reviewFrontendCommits'); },
  },
  {
    completed: true,
    get content() { return $t('app.checkAndOptimizeSystemPerformanceToReduceCpuUsage'); },
    date: '2024-07-30 11:00:00',
    get title() { return $t('app.optimizeSystemPerformance'); },
  },
  {
    completed: false,
    get content() { return $t('app.checkSystemSecurityForVulnerabilitiesAndUnauthorizedAccess'); },
    date: '2024-07-30 11:00:00',
    get title() { return $t('app.securityCheck'); },
  },
  {
    completed: false,
    get content() { return $t('app.updateAllNpmDependenciesInTheProjectToTheirLatest'); },
    date: '2024-07-30 11:00:00',
    get title() { return $t('app.updateProjectDependencies'); },
  },
  {
    completed: false,
    get content() { return $t('app.fixReportedUiIssuesAndEnsureAConsistentExperienceAcross'); },
    date: '2024-07-30 11:00:00',
    get title() { return $t('app.fixUiIssues'); },
  },
]);
const trendItems = computed<WorkbenchTrendItem[]>(() => ([
  {
    avatar: 'svg:avatar-1',
    content: $t('app.createdProjectVueInOpenSourceTeam'),
    date: $t('app.justNow'),
    title: $t('app.william'),
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('app.followedWilliam'),
    date: $t('app.text1HourAgo'),
    title: $t('app.evan'),
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('app.publishedAStatusUpdate'),
    date: $t('app.text1DayAgo'),
    title: $t('app.chris'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('app.publishedHowToWriteAVitePlugin'),
    date: $t('app.text2DaysAgo'),
    title: 'Vben',
  },
  {
    avatar: 'svg:avatar-1',
    content: $t('app.repliedToJackAboutHowToOptimizeAProject'),
    date: $t('app.text3DaysAgo'),
    title: $t('app.peter'),
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('app.closedTheIssueHowToRunTheProject'),
    date: $t('app.text1WeekAgo'),
    title: $t('app.jack'),
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('app.publishedAStatusUpdate'),
    date: $t('app.text1WeekAgo'),
    title: $t('app.william'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('app.pushedCodeToGithub'),
    date: '2021-04-01 20:00',
    title: $t('app.william'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('app.publishedHowToUseVbenAdmin'),
    date: '2021-03-01 20:00',
    title: 'Vben',
  },
]));

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>{{ $t('app.goodMorningValueTimeToStartYourDay', { value1: userStore.userInfo?.realName }) }}</template>
      <template #description>{{ $t('app.sunnyToday20C32C') }}</template>
    </WorkbenchHeader>

    <div class="flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" :title="$t('app.projects')" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" :title="$t('app.recentActivity')" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="lg:mt-0"
          :title="$t('app.quickNavigation')"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" :title="$t('app.tasks')" />
        <AnalysisChartCard class="mt-5" :title="$t('app.trafficSources')">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
