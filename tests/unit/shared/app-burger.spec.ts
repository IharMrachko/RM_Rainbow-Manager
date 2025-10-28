import { mount } from '@vue/test-utils';
import AppBurgerMenu from '@/shared/components/AppBurgerMenu.vue';
import { createStore } from 'vuex';

describe('AppBurger', () => {
  let wrapper: any;
  let setBurgerMock: jest.Mock;

  beforeEach(() => {
    setBurgerMock = jest.fn((ctx, payload) => {
      // имитируем мутацию стора
      ctx.state.isOpen = payload.isOpen;
    });

    const store = createStore({
      modules: {
        burgerMenu: {
          namespaced: true,
          state: () => ({
            isOpen: false,
          }),
          getters: {
            isOpen: (state) => state.isOpen,
          },
          actions: {
            setBurger: setBurgerMock,
          },
        },
      },
    });

    wrapper = mount(AppBurgerMenu, {
      global: {
        plugins: [store],
      },
    });
  });

  afterEach(() => {
    wrapper.unmount();
    wrapper = null;
  });

  it('matches snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('if burger click should burger contain class open', async () => {
    const burger = wrapper.find('[data-burger-test-id]');
    await burger.trigger('click');
    expect(burger.classes()).toContain('open');
  });

  it('dispatches correct action with isOpen true/false', async () => {
    const burger = wrapper.find('[data-burger-test-id]');
    await burger.trigger('click');
    expect(setBurgerMock).toHaveBeenCalledWith(expect.any(Object), {
      isOpen: true,
    });
    await burger.trigger('click');
    expect(setBurgerMock).toHaveBeenCalledWith(expect.any(Object), {
      isOpen: false,
    });
  });
  it('renders exactly 3 span lines', () => {
    const spans = wrapper.findAll('span');
    expect(spans).toHaveLength(3);
  });

  it('applies open class styles to spans', async () => {
    const burger = wrapper.find('[data-burger-test-id]');
    await burger.trigger('click');
    expect(burger.classes()).toContain('open');
    // можно проверить конкретный span
    const spans = burger.findAll('span');
    expect(spans[1].element.getAttribute('style')).toBeNull(); // стили применяются через CSS, но класс есть
  });
});
