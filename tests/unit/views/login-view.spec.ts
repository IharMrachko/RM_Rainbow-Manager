import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/auth/views/LoginView.vue';
import { i18n } from '../../../i18n';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';

describe('LoginView.vue', () => {
  let store: any;
  let actions: any;
  let router: any;

  beforeEach(() => {
    actions = {
      login: jest.fn(),
    };

    store = createStore({
      modules: {
        authFirebase: {
          namespaced: true,
          getters: {
            isLoading: () => false,
          },
          actions,
        },
      },
    });

    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/main', name: 'main', component: { template: '<div>Main</div>' } }],
    });
  });

  const factory = () =>
    mount(LoginView, {
      global: {
        plugins: [store, router, i18n],
        stubs: ['router-link', 'font-awesome-icon'],
      },
    });

  it('renders form correctly', () => {
    const wrapper = factory();
    expect(wrapper.find('h1.title').text()).toBe('Login'); // i18n мокается как ключ
    expect(wrapper.findAllComponents(AppInput)).toHaveLength(2);
    expect(wrapper.findComponent(AppButton).exists()).toBe(true);
  });

  it('applies transform on mouse move and resets on mouse leave', async () => {
    const wrapper = factory();
    const img = wrapper.find('img').element as HTMLImageElement;

    const div = wrapper.find('.login-pic');
    const rect = { left: 0, top: 0, width: 100, height: 100 } as DOMRect;
    jest.spyOn(img, 'getBoundingClientRect').mockReturnValue(rect);

    await div.trigger('mousemove', { clientX: 60, clientY: 40 });
    expect(img.style.transform).toContain('rotateX');
    expect(img.style.transform).toContain('rotateY');

    await div.trigger('mouseleave');
    expect(img.style.transform).toBe('perspective(300px) rotateX(0deg) rotateY(0deg)');
  });
});
