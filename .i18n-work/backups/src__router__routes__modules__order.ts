import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'OrderManagement',
    path: '/management/orders',
    component: () => import('#/views/manage/order/index.vue'),
    meta: {
      title: '订单管理',
      icon: 'lucide:shopping-bag',
      order: 22,
    },
  },
];

export default routes;
