import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Management',
    path: '/management',
    meta: {
      icon: 'lucide:settings',
      title: '系统管理',
      order: 20,
    },
    children: [
      {
        name: 'UserManagement',
        path: '/management/users',
        component: () => import('#/views/manage/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'lucide:user',
        },
      },
      {
        name: 'EmailCodeRecord',
        path: '/management/email-codes',
        component: () => import('#/views/manage/email-code/index.vue'),
        meta: {
          title: '邮箱验证码记录',
          icon: 'lucide:mail-check',
        },
      },
      {
        name: 'LoginLog',
        path: '/management/login-logs',
        component: () => import('#/views/manage/login-log/index.vue'),
        meta: {
          title: '登录日志',
          icon: 'lucide:clipboard-list',
        },
      },
    ],
  },
  {
    name: 'ProductManagement',
    path: '/management/products',
    redirect: '/management/products/list',
    meta: {
      title: '商品管理',
      icon: 'lucide:package',
      order: 21,
    },
    children: [
      {
        name: 'ProductList',
        path: '/management/products/list',
        component: () => import('#/views/manage/product/index.vue'),
        meta: {
          title: '商品列表',
          icon: 'lucide:list',
        },
      },
      {
        name: 'CategoryManagement',
        path: '/management/products/categories',
        component: () => import('#/views/manage/category/index.vue'),
        meta: {
          title: '商品分类管理',
          icon: 'lucide:folder',
        },
      },
      {
        name: 'HomeHot',
        path: '/management/products/home-hot',
        component: () => import('#/views/manage/home-hot/index.vue'),
        meta: {
          title: '首页热门',
          icon: 'lucide:fire',
        },
      },
    ],
  },
];

export default routes;
