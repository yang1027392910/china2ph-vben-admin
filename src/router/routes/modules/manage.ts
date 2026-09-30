import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Management',
    path: '/management',
    meta: {
      icon: 'lucide:settings',
      title: 'app.systemManagement',
      order: 20,
    },
    children: [
      {
        name: 'CouponManagement',
        path: '/management/coupons',
        component: () => import('#/views/manage/coupon/index.vue'),
        meta: { title: 'app.couponManagement', icon: 'lucide:ticket' },
      },
      {
        name: 'UserManagement',
        path: '/management/users',
        component: () => import('#/views/manage/user/index.vue'),
        meta: {
          title: 'app.userManagement',
          icon: 'lucide:user',
        },
      },
      {
        name: 'UserVerificationManagement',
        path: '/management/user-verifications',
        component: () => import('#/views/manage/user-verification/index.vue'),
        meta: {
          title: 'app.userVerification',
          icon: 'lucide:user-check',
        },
      },
      {
        name: 'EmailCodeRecord',
        path: '/management/email-codes',
        component: () => import('#/views/manage/email-code/index.vue'),
        meta: {
          title: 'app.emailVerificationCodes',
          icon: 'lucide:mail-check',
        },
      },
      {
        name: 'LoginLog',
        path: '/management/login-logs',
        component: () => import('#/views/manage/login-log/index.vue'),
        meta: {
          title: 'app.loginLogs',
          icon: 'lucide:clipboard-list',
        },
      },
      {
        name: 'BannerManagement',
        path: '/management/banners',
        component: () => import('#/views/manage/banner/index.vue'),
        meta: {
          title: 'app.bannerManagement',
          icon: 'lucide:image',
        },
      },
      {
        name: 'HomeNavigationManagement',
        path: '/management/home-navigation',
        component: () => import('#/views/manage/home-navigation/index.vue'),
        meta: {
          title: 'app.homeNavigation',
          icon: 'lucide:layout-grid',
        },
      },
      {
        name: 'ProcurementContact',
        path: '/management/procurement-contacts',
        component: () => import('#/views/manage/procurement-contact/index.vue'),
        meta: {
          title: 'app.customerSupport',
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
      title: 'app.productManagement',
      icon: 'lucide:package',
      order: 21,
    },
    children: [
      {
        name: 'ProductList',
        path: '/management/products/list',
        component: () => import('#/views/manage/product/index.vue'),
        meta: {
          title: 'app.productList',
          icon: 'lucide:list',
        },
      },
      {
        name: 'CategoryManagement',
        path: '/management/products/categories',
        component: () => import('#/views/manage/category/index.vue'),
        meta: {
          title: 'app.productCategories',
          icon: 'lucide:folder',
        },
      },
      {
        name: 'HomeHot',
        path: '/management/products/home-hot',
        component: () => import('#/views/manage/home-hot/index.vue'),
        meta: {
          title: 'app.featuredProducts',
          icon: 'lucide:fire',
        },
      },
      {
        name: 'ProductSupplier',
        path: '/management/products/suppliers',
        component: () => import('#/views/manage/supplier/index.vue'),
        meta: {
          title: 'app.productSuppliers',
          icon: 'lucide:store',
        },
      },
      {
        name: 'LogisticsSupplier',
        path: '/management/products/logistics-suppliers',
        component: () => import('#/views/manage/logistics-supplier/index.vue'),
        meta: {
          title: 'app.logisticsSuppliers',
          icon: 'lucide:ship',
        },
      },
    ],
  },
];

export default routes;
