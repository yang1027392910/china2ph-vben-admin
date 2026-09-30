import fs from 'node:fs';
function edit(path, fn){const s=fs.readFileSync(path,'utf8');fs.writeFileSync(path,fn(s));}
const extra={
  greaterThanOrEqual:['大于等于','greater than or equal to'], greaterThan:['大于','greater than'],
  completed:['已完成','Completed'], none:['无','None'], inStock:['现货','In Stock'], preOrder:['预售','Pre-order'],
  perKg:['每公斤','Per kg'], perItem:['每件','Per item'], byVolume:['按体积','By volume'],
};
for(const lang of ['zh-CN','en-US'])edit(`src/locales/langs/${lang}/app.json`,s=>{const data=JSON.parse(s);for(const [key,values]of Object.entries(extra))data[key]=values[lang==='zh-CN'?0:1];return JSON.stringify(data,null,2)+'\n';});
edit('src/views/manage/coupon/index.vue',s=>s.replace("allowZero ? '大于等于' : '大于'","allowZero ? $t('app.greaterThanOrEqual') : $t('app.greaterThan')"));
edit('src/components/rich-text-editor/index.vue',s=>s.replace("placeholder: $t('app.enterContent'),","placeholder: '',").replace(':data-placeholder="placeholder"',':data-placeholder="placeholder || $t(\'app.enterContent\')"'));
edit('src/views/manage/order/index.vue',s=>s.replace("const paymentMethodLabels: Record<string, string> = {",'const paymentMethodLabels = computed<Record<string, string>>(() => ({').replace("  0: 'None',","  0: $t('app.none'),").replace("  2: 'Maya',\n};","  2: 'Maya',\n}));").replace('return paymentMethodLabels[String(value)]','return paymentMethodLabels.value[String(value)]').replace("return 'Completed';","return $t('app.completed');").replace('                Approve','                {{ $t(\'app.approve\') }}'));
edit('src/views/manage/product/index.vue',s=>s.replace("const saleTypeOptions = [\n  { label: 'In Stock', value: 1 },\n  { label: 'Pre-order', value: 2 },\n];","const saleTypeOptions = computed(() => [\n  { label: $t('app.inStock'), value: 1 },\n  { label: $t('app.preOrder'), value: 2 },\n]);"));
for(const file of fs.readdirSync('src/views/dashboard/analytics').filter(f=>/^analytics-visits.*\.vue$/.test(f))){
 edit('src/views/dashboard/analytics/'+file,s=>s.replace("import { onMounted, ref } from 'vue';","import { onMounted, ref, watch } from 'vue';\nimport { i18n } from '@vben/locales';").replace('onMounted(() => {','function renderChart() {').replace('});\n</script>',"}\nonMounted(renderChart);\nwatch(() => i18n.global.locale.value, renderChart);\n</script>"));
}
edit('src/api/core/logistics-supplier.ts',s=>s.replace('export namespace LogisticsSupplierApi {',`// Backend protocol values must remain unchanged when the UI language switches.
export const SHIPPING_METHOD = {
  sea: '海运',
  air: '空运',
  road: '陆运',
  express: '快递',
} as const;

export namespace LogisticsSupplierApi {`));
edit('src/views/manage/logistics-supplier/index.vue',s=>{
 s=s.replace("import { $t } from '#/locales';","import { $t } from '#/locales';\nimport { SHIPPING_METHOD } from '#/api/core/logistics-supplier';");
 for(const [cn,key]of [['海运','sea'],['空运','air'],['陆运','road'],['快递','express']])s=s.replaceAll(`value: '${cn}'`,`value: SHIPPING_METHOD.${key}`).replaceAll(`shippingMethod: '${cn}'`,`shippingMethod: SHIPPING_METHOD.${key}`);
 s=s.replace("const pricingMethodOptions = [\n  { label: 'Per kg', value: 'Per kg' },\n  { label: 'Per Item', value: 'Per Item' },\n  { label: 'By Volume', value: 'By Volume' },\n];", "const pricingMethodOptions = computed(() => [\n  { label: $t('app.perKg'), value: 'Per kg' },\n  { label: $t('app.perItem'), value: 'Per Item' },\n  { label: $t('app.byVolume'), value: 'By Volume' },\n]);");
 s=s.replace('        <template v-else-if="column.key === \'status\'">',`        <template v-else-if="column.key === 'shippingMethod'">
          {{ shippingMethodOptions.find((option) => option.value === record.shippingMethod)?.label ?? record.shippingMethod }}
        </template>
        <template v-else-if="column.key === 'pricingMethod'">
          {{ pricingMethodOptions.find((option) => option.value === record.pricingMethod)?.label ?? record.pricingMethod }}
        </template>
        <template v-else-if="column.key === 'status'">`);
 return s;
});
