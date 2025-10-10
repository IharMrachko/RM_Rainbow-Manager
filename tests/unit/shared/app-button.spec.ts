import { mount } from '@vue/test-utils';
import AppButton from '@/shared/components/AppButton.vue';
import { i18n } from '../../../i18n';

describe('AppButton.vue', () => {
  it('renders title when not loading', () => {
    const wrapper = mount(AppButton, {
      props: { title: 'login', loading: false },
      global: {
        plugins: [i18n],
      },
    });
    // Проверяем, что текст отобразился
    expect(wrapper.text()).toContain('Login');
    // Loader отсутствует
    expect(wrapper.find('.loader').exists()).toBe(false);
  });

  it('shows loader when loading', () => {
    const wrapper = mount(AppButton, {
      props: { title: 'login', loading: true },
      global: {
        plugins: [i18n],
      },
    });

    // Текст скрыт
    expect(wrapper.text()).not.toContain('Login');
    // Loader есть
    expect(wrapper.find('.loader').exists()).toBe(true);
  });
  it('disables button when disabled prop is true', () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('disables button when loading is true', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('applies correct severity class', () => {
    const wrapper = mount(AppButton, {
      props: { severity: 'error' },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('error');
  });
  it('applies correct raised class', () => {
    const wrapper = mount(AppButton, {
      props: { raised: true },
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('raised');
  });
  it('if icons props not empty ', () => {
    const wrapper = mount(AppButton, {
      props: { icon: ['fas', 'save'] },
      global: {
        plugins: [i18n],
      },
    });

    const icon = wrapper.find('.btn-icon');
    expect(icon.exists()).toBe(true);
  });
});
