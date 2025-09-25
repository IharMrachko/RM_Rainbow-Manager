import { mount } from '@vue/test-utils';
import AppButton from '@/shared/components/AppButton.vue';

describe('AppButton.vue', () => {
  it('renders title when not loading', () => {
    const wrapper = mount(AppButton, {
      props: { title: 'Click me', loading: false },
    });
    // Проверяем, что текст отобразился
    expect(wrapper.text()).toContain('Click me');
    // Loader отсутствует
    expect(wrapper.find('.loader').exists()).toBe(false);
  });

  it('shows loader when loading', () => {
    const wrapper = mount(AppButton, {
      props: { title: 'Click me', loading: true },
    });

    // Текст скрыт
    expect(wrapper.text()).not.toContain('Click me');
    // Loader есть
    expect(wrapper.find('.loader').exists()).toBe(true);
  });
  it('disables button when disabled prop is true', () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('disables button when loading is true', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('applies correct typeBtn class', () => {
    const wrapper = mount(AppButton, {
      props: { typeBtn: 'error' },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('error');
  });
});
