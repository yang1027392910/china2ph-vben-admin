<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';

import { Button } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    aiLoading?: boolean;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    aiLoading: false,
    modelValue: '',
    placeholder: '请输入内容',
  },
);

const emit = defineEmits<{
  aiGenerate: [value: string];
  'update:modelValue': [value: string];
}>();

const editorRef = ref<HTMLElement>();

function syncEditor(value = props.modelValue) {
  const editor = editorRef.value;

  if (editor && editor.innerHTML !== value) {
    editor.innerHTML = value;
  }
}

function updateModel() {
  emit('update:modelValue', editorRef.value?.innerHTML ?? '');
}

function format(command: string, value?: string) {
  editorRef.value?.focus();
  document.execCommand(command, false, value);
  updateModel();
}

function createLink() {
  const selection = window.getSelection();
  const range =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : undefined;
  const href = window.prompt('请输入链接地址');

  if (!href) {
    return;
  }

  if (
    range &&
    selection &&
    editorRef.value?.contains(range.commonAncestorContainer)
  ) {
    selection.removeAllRanges();
    selection.addRange(range);
  }

  format('createLink', href.trim());
}

function generateByAi() {
  emit('aiGenerate', editorRef.value?.innerHTML ?? props.modelValue);
}

watch(
  () => props.modelValue,
  (value) => {
    nextTick(() => {
      syncEditor(value);
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="rich-text-editor">
    <div class="rich-text-toolbar">
      <Button size="small" @mousedown.prevent="format('bold')">B</Button>
      <Button size="small" @mousedown.prevent="format('italic')">I</Button>
      <Button size="small" @mousedown.prevent="format('underline')">U</Button>
      <Button size="small" @mousedown.prevent="format('insertUnorderedList')">
        列表
      </Button>
      <Button size="small" @mousedown.prevent="format('insertOrderedList')">
        编号
      </Button>
      <Button size="small" @mousedown.prevent="createLink">链接</Button>
      <Button size="small" @mousedown.prevent="format('removeFormat')">
        清除格式
      </Button>
      <Button
        :loading="aiLoading"
        size="small"
        @mousedown.prevent="generateByAi"
      >
        AI生成
      </Button>
    </div>
    <div
      ref="editorRef"
      :data-placeholder="placeholder"
      class="rich-text-content"
      contenteditable="true"
      @input="updateModel"
    ></div>
  </div>
</template>

<style scoped>
.rich-text-editor {
  overflow: hidden;
  border: 1px solid hsl(240 3.7% 22%);
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.rich-text-editor:hover {
  border-color: #4096ff;
}

.rich-text-editor:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgb(5 145 255 / 10%);
}

.rich-text-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: transparent;
  border-bottom: 1px solid hsl(240 3.7% 22%);
}

.rich-text-toolbar :deep(.ant-btn) {
  min-width: 32px;
}

.rich-text-content {
  min-height: 132px;
  padding: 8px 11px;
  overflow-y: auto;
  line-height: 1.6;
  outline: none;
}

.rich-text-content:empty::before {
  color: #bfbfbf;
  pointer-events: none;
  content: attr(data-placeholder);
}

.rich-text-content :deep(ul),
.rich-text-content :deep(ol) {
  padding-left: 22px;
  margin: 0 0 8px;
}

.rich-text-content :deep(p) {
  margin: 0 0 8px;
}

.rich-text-content :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}
</style>
