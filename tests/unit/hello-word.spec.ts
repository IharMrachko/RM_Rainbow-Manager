import { shallowMount } from '@vue/test-utils';
import HelloWorld from '@/components/HelloWorld.vue';
import { createStore } from 'vuex';

describe('HelloWorld.vue', () => {
  it('renders props.msg when passed', () => {
    const store = createStore({
      state() {
        return { count: 42 };
      },
    });
    const msg = 'new message';
    const wrapper = shallowMount(HelloWorld, {
      props: { msg },
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.text()).toMatch(msg);
  });
});
