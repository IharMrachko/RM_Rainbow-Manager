// Tabs.spec.ts
import { mount } from '@vue/test-utils';
import AppTabs from '@/shared/components/tabs/AppTabs.vue';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  locale: 'en',
  messages: { en: {} },
});
function mountWithTabs(props = {}) {
  return mount(AppTabs, {
    props,
    global: {
      plugins: [i18n],
    },
    slots: {
      default: '<div>content</div>',
    },
  });
}

describe('AppTabs.vue', () => {
  it('renders slot content', () => {
    const wrapper = mountWithTabs();
    expect(wrapper.find('.tab-content').text()).toContain('content');
  });

  it('registers tabs and shows headers', async () => {
    const wrapper = mountWithTabs({ modelValue: 0 });
    (wrapper.vm as any).tabs.push({ title: 'Tab1', index: 0, disabled: false });
    (wrapper.vm as any).tabs.push({ title: 'Tab2', index: 1, disabled: false });
    await wrapper.vm.$nextTick();

    const items = wrapper.findAll('li');
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain('Tab1');
  });

  it('activates tab by modelValue', async () => {
    const wrapper = mountWithTabs({ modelValue: 0 });
    (wrapper.vm as any).tabs.push({ title: 'Tab1', index: 0, disabled: false });
    (wrapper.vm as any).tabs.push({ title: 'Tab2', index: 1, disabled: false });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('li')[0].classes()).toContain('active');
  });

  it('emits update:modelValue and change on click', async () => {
    const wrapper = mountWithTabs({ modelValue: 0 });
    (wrapper.vm as any).tabs.push({ title: 'Tab1', index: 0, disabled: false });
    (wrapper.vm as any).tabs.push({ title: 'Tab2', index: 1, disabled: false });
    await wrapper.vm.$nextTick();

    await wrapper.findAll('li')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    expect(wrapper.emitted('change')?.[0]).toEqual([1]);
  });

  it('ignores click on disabled tab', async () => {
    const wrapper = mountWithTabs({ modelValue: 0 });
    (wrapper.vm as any).tabs.push({ title: 'Tab1', index: 0, disabled: false });
    (wrapper.vm as any).tabs.push({ title: 'Tab2', index: 1, disabled: true });
    await wrapper.vm.$nextTick();

    await wrapper.findAll('li')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });
});
