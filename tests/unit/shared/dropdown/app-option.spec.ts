import { mount } from '@vue/test-utils';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import { ref } from 'vue';

describe('AppOption', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppOption, {
      props: { value: 'A' },
      slots: {
        default: 'Option A',
      },
    });

    expect(wrapper.text()).toContain('Option A');
  });
  it('calls select with correct value on click', async () => {
    const mockSelect = jest.fn();

    const wrapper = mount(AppOption, {
      props: { value: 'B' },
      slots: {
        default: 'Option B',
      },
      global: {
        provide: {
          select: mockSelect,
        },
      },
    });

    await wrapper.trigger('click');
    expect(mockSelect).toHaveBeenCalledWith('B');
  });
  it('applies is-selected class when selected matches', () => {
    const selected = ref('C');

    const wrapper = mount(AppOption, {
      props: { value: 'C' },
      slots: {
        default: 'Option C',
      },
      global: {
        provide: {
          selected,
        },
      },
    });

    expect(wrapper.classes()).toContain('is-selected');
  });
  it('compares objects by id when both are objects', () => {
    const selected = ref({ id: 1, name: 'Test' });

    const wrapper = mount(AppOption, {
      props: { value: { id: 1, name: 'Test' } },
      slots: {
        default: 'Option Object',
      },
      global: {
        provide: {
          selected,
        },
      },
    });

    expect(wrapper.classes()).toContain('is-selected');
  });
});
