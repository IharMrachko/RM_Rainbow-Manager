import { mount } from '@vue/test-utils';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import { defineComponent, inject } from 'vue';
import { i18n } from '../../../../i18n';

describe('AppDropdown', () => {
  it('renders input and toggle button', () => {
    const wrapper = mount(AppDropdown, {
      props: {
        modelValue: 'Option A',
        label: 'name',
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.findComponent({ name: 'AppInput' }).exists()).toBe(true);
    expect(wrapper.find('button.toggle-btn').exists()).toBe(true);
  });

  it('disabled toggle button', () => {
    const wrapper = mount(AppDropdown, {
      props: {
        disabled: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('button.toggle-btn').attributes('disabled')).toBeDefined();
  });

  it('not disabled toggle button', () => {
    const wrapper = mount(AppDropdown, {
      props: {
        disabled: false,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('button.toggle-btn').attributes('disabled')).not.toBeDefined();
  });

  it('toggles visibility on click', async () => {
    const wrapper = mount(AppDropdown, {
      props: {
        modelValue: 'Option A',
        label: 'name',
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.vm.visible).toBe(false);
    await wrapper.find('.dropdown-container').trigger('click');
    expect(wrapper.vm.visible).toBe(true);
  });

  it('emits update:modelValue when select is called', async () => {
    const TestOption = defineComponent({
      name: 'TestOption',
      setup() {
        const select = inject('select')!;
        return { select };
      },
      template: `<div class="test-option" @click="select({ name: 'Option B' })">Option</div>`,
    });

    const wrapper = mount(AppDropdown, {
      props: {
        modelValue: '',
        label: 'name',
      },
      slots: {
        default: TestOption,
      },
      global: {
        plugins: [i18n],
      },
      attachTo: document.body,
    });

    // Активируем overlay, чтобы слот появился

    await wrapper.find('.dropdown-container').trigger('click');
    await wrapper.vm.$nextTick();

    const option = document.body.querySelector('.test-option');
    expect(option).not.toBeNull(); // ✅ проверка, что элемент есть
    (option as HTMLElement).click(); // вызов select()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.vm.valueRef).toBe('Option B');
  });
});
