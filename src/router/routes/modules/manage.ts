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
        name: 'UserVerificationManagement',
        path: '/management/user-verifications',
        component: () => import('#/views/manage/user-verification/index.vue'),
        meta: {
          title: '用户认证管理',
          icon: 'lucide:user-check',
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
      {
        name: 'BannerManagement',
        path: '/management/banners',
        component: () => import('#/views/manage/banner/index.vue'),
        meta: {
          title: 'Banner管理',
          icon: 'lucide:image',
        },
      },
      {
        name: 'HomeNavigationManagement',
        path: '/management/home-navigation',
        component: () => import('#/views/manage/home-navigation/index.vue'),
        meta: {
          title: '首页导航',
          icon: 'lucide:layout-grid',
        },
      },
      {
        name: 'ProcurementContact',
        path: '/management/procurement-contacts',
        component: () => import('#/views/manage/procurement-contact/index.vue'),
        meta: {
          title: '客服管理',
          icon: 'lucide:headphones',
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
      {
        name: 'ProductSupplier',
        path: '/management/products/suppliers',
        component: () => import('#/views/manage/supplier/index.vue'),
        meta: {
          title: '商品供应商',
          icon: 'lucide:store',
        },
      },
      {
        name: 'LogisticsSupplier',
        path: '/management/products/logistics-suppliers',
        component: () => import('#/views/manage/logistics-supplier/index.vue'),
        meta: {
          title: '物流供应商',
          icon: 'lucide:ship',
        },
      },
    ],
  },
];

export default routes;
