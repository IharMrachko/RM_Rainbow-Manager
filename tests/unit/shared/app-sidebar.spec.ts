// Sidebar.spec.ts
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import AppSidebar from '@/shared/components/AppSidebar.vue';

describe('Sidebar.vue', () => {
  let breakPoint = ref('desktop');
  let burgerOpen = ref(false);

  const storeMock = {
    getters: {
      get 'mobile/breakPoint'() {
        return breakPoint.value;
      },
      get 'burgerMenu/isOpen'() {
        return burgerOpen.value;
      },
    },
  };

  const mountSidebar = (props = {}) =>
    mount(AppSidebar, {
      props,
      global: {
        mocks: {
          $store: storeMock,
        },
        provide: {
          store: storeMock,
        },
      },
      slots: {
        main: `<template #main="{ isShort }"><div class="main-slot">Main {{ isShort }}</div></template>`,
        additional: `<template #additional="{ isShort, toggle }"><button class="toggle" @click="toggle()">Toggle {{ isShort }}</button></template>`,
      },
    });

  beforeEach(() => {
    breakPoint.value = 'desktop';
    burgerOpen.value = false;
  });

  it('renders aside when not mobile', () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('aside').exists()).toBe(true);
  });

  it('does not render aside when mobile and burger closed', () => {
    breakPoint.value = 'mobile';
    burgerOpen.value = false;
    const wrapper = mountSidebar();
    expect(wrapper.find('aside').exists()).toBe(false);
  });

  it('renders aside in body when mobile and burger open', () => {
    breakPoint.value = 'mobile';
    burgerOpen.value = true;

    const wrapper = mount(AppSidebar, {
      attachTo: document.body, // важно, чтобы Teleport реально вставил в body
      global: {
        mocks: {
          $store: storeMock,
        },
        provide: {
          store: storeMock,
        },
      },
    });

    // проверяем, что aside появился в body
    expect(document.body.querySelector('aside')).not.toBeNull();

    // при желании можно проверить класс mobile-view
    expect(document.body.querySelector('aside')?.classList.contains('mobile-view')).toBe(true);

    wrapper.unmount();
  });

  it('passes isShort to slots', () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('.main-slot').text()).toContain('true');
  });

  it('toggle changes isShort', async () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('.main-slot').text()).toContain('true');
    await wrapper.find('.toggle').trigger('click');
    expect(wrapper.find('.main-slot').text()).toContain('false');
  });

  it('updates isShort when breakpoint changes to mobile', async () => {
    const wrapper = mountSidebar();
    expect(wrapper.vm.isShort).toBe(true);

    breakPoint.value = 'mobile';
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isShort).toBe(false);
  });
});
