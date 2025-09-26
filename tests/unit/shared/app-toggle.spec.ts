import { mount } from '@vue/test-utils';
import AppToggle from '@/shared/components/AppToggle.vue';

describe('AppToggle', () => {
  it('renders with default props', () => {
    const wrapper = mount(AppToggle);
    const label = wrapper.find('label');
    expect(label.classes()).toContain('default');
    expect(label.attributes('aria-disabled')).toBe('false');
  });
  it('disables button when disabled prop is true', () => {
    const wrapper = mount(AppToggle, {
      props: { disabled: true },
    });
    const label = wrapper.find('label');
    const input = wrapper.find('input');
    expect(label.classes()).toContain('disabled');
    expect(input.attributes('disabled')).toBeDefined();
  });
  it('not disables button when disabled prop is false', () => {
    const wrapper = mount(AppToggle, {
      props: { disabled: false },
    });
    const label = wrapper.find('label');
    const input = wrapper.find('input');
    expect(label.classes()).not.toContain('disabled');
    expect(input.attributes('disabled')).not.toBeDefined();
  });

  it('Should be able default when prop variant is default', () => {
    const wrapper = mount(AppToggle, {
      props: { variant: 'default' },
    });
    const label = wrapper.find('label');
    expect(label.classes()).toContain('default');
  });

  it('Should be able default when prop variant is theme', () => {
    const wrapper = mount(AppToggle, {
      props: { variant: 'theme' },
    });
    const label = wrapper.find('label');
    expect(label.classes()).toContain('theme');
  });
  it('Should be able checked when prop modelValue is true', () => {
    const wrapper = mount(AppToggle, {
      props: { modelValue: true },
    });
    const input = wrapper.find('input');
    expect(input.attributes('checked')).toBeDefined();
  });
  it('Should be able checked when prop modelValue is false', () => {
    const wrapper = mount(AppToggle, {
      props: { modelValue: false },
    });
    const input = wrapper.find('input');
    expect(input.attributes('checked')).not.toBeDefined();
  });

  it('emits events on input change', async () => {
    const wrapper = mount(AppToggle, {
      props: { modelValue: false },
    });
    const input = wrapper.find('input');
    await input.setValue(true);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true]);
    expect(wrapper.emitted('toggled')![0]).toEqual([true]);
  });
  it('emits events on keyboard toggle (Enter)', async () => {
    const wrapper = mount(AppToggle, {
      props: { modelValue: false },
    });
    const label = wrapper.find('label');
    await label.trigger('keydown.enter');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true]);
    expect(wrapper.emitted('toggled')![0]).toEqual([true]);
  });
  it('does not emit events when disabled', async () => {
    const wrapper = mount(AppToggle, {
      props: { modelValue: false, disabled: true },
    });
    const label = wrapper.find('label');
    await label.trigger('keydown.enter');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('toggled')).toBeUndefined();
  });
});
