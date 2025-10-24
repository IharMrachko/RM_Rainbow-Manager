// Tab.spec.ts
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import AppTab from '@/shared/components/tabs/AppTab.vue';

describe('Tab.vue', () => {
  it('calls register on mount with title and disabled', () => {
    const registerMock = jest.fn().mockReturnValue(0);
    const activeIndex = ref(0);

    mount(AppTab, {
      props: { title: 'MyTab', disabled: false },
      global: {
        provide: {
          registerTab: registerMock,
          activeIndex,
        },
      },
    });

    expect(registerMock).toHaveBeenCalledWith('MyTab', false);
  });

  it('renders slot when active', async () => {
    const registerMock = jest.fn().mockReturnValue(0);
    const activeIndex = ref(0);

    const wrapper = mount(AppTab, {
      props: { title: 'Tab1' },
      global: {
        provide: {
          registerTab: registerMock,
          activeIndex,
        },
      },
      slots: {
        default: '<span class="slot-content">Hello</span>',
      },
    });

    expect(wrapper.find('.slot-content').exists()).toBe(true);
  });

  it('hides slot when not active', async () => {
    const registerMock = jest.fn().mockReturnValue(1);
    const activeIndex = ref(0);

    const wrapper = mount(AppTab, {
      props: { title: 'Tab2' },
      global: {
        provide: {
          registerTab: registerMock,
          activeIndex,
        },
      },
      slots: {
        default: '<span class="slot-content">Hidden</span>',
      },
    });

    expect(wrapper.find('.slot-content').isVisible()).toBe(false);
  });

  it('registers with disabled=true', () => {
    const registerMock = jest.fn().mockReturnValue(2);
    const activeIndex = ref(0);

    mount(AppTab, {
      props: { title: 'DisabledTab', disabled: true },
      global: {
        provide: {
          registerTab: registerMock,
          activeIndex,
        },
      },
    });

    expect(registerMock).toHaveBeenCalledWith('DisabledTab', true);
  });
});
