import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { i18n } from '../../../i18n';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';
import SignInView from '@/views/open/views/SignInView.vue';

describe('SignInView.vue', () => {
  let store: any;
  let actions: any;
  let router: any;

  const VFormStub = {
    template: `
    <form @submit.prevent="$emit('submit', { email: $refs.e?.value, password: $refs.p?.value })">
      <slot />
    </form>
  `,
  };
  const AppInputStub = {
    props: ['modelValue', 'placeholder', 'name'],
    emits: ['update:modelValue'],
    template: `<input :name="name" :placeholder="placeholder" :value="modelValue"
                      @input="$emit('update:modelValue', $event.target.value)" ref="input" />`,
  };
  beforeEach(() => {
    actions = {
      // action должен возвращать промис, чтобы компонент дождался результата
      login: jest.fn().mockResolvedValue({}),
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
    router.push = jest.fn();
  });

  const factory = () =>
    mount(SignInView, {
      global: {
        plugins: [store, router, i18n],
        stubs: {
          VForm: VFormStub,
          AppInput: AppInputStub,
          'router-link': true,
          'font-awesome-icon': true,
        },
      },
    });

  it('renders form correctly', () => {
    const wrapper = factory();
    expect(wrapper.find('h1.title').text()).toBe('Sign in'); // i18n мокается как ключ
    expect(wrapper.findAllComponents(AppInput)).toHaveLength(2);
    expect(wrapper.findComponent(AppButton).exists()).toBe(true);
  });

  it('dispatches login and navigates to /main on successful submit', async () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue({});
    const wrapper = factory();
    expect(wrapper.exists()).toBe(true);

    const vform = wrapper.findComponent(VFormStub);
    await vform.vm.$emit('submit', { email: 'test@example.com', password: '123456' });
    await flushPromises();

    expect(dispatchSpy).toHaveBeenCalledWith('authFirebase/login', {
      email: 'test@example.com',
      password: '123456',
    });
    const pushSpy = jest.spyOn(router, 'push').mockResolvedValue(undefined);
    expect(pushSpy).toHaveBeenCalledWith('/main');
  });
});
