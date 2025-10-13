import { createStore } from 'vuex';
import { flushPromises, mount } from '@vue/test-utils';
import AppToaster from '@/shared/components/AppToaster.vue';
import { nextTick } from 'vue';
import { Toast } from '@/store/modules/toast';
import { i18n } from '../../../i18n';

describe('AppToaster', () => {
  let store: any;
  let actions: any;
  let state: any;
  let getters: any;
  let wrapper: any;

  beforeEach(() => {
    actions = {
      deleteToast: jest.fn(),
    };
    state = {
      toast: {
        toasts: [
          { id: 1, message: 'Success message', severity: 'success', duration: 3000 },
          { id: 2, message: 'Error message', severity: 'error', duration: 5000 },
        ] as Toast[],
      },
    };
    getters = {
      getToasts: () => state.toast.toasts,
    };
    store = createStore({
      modules: {
        toast: {
          namespaced: true,
          state: state.toast,
          actions,
          getters,
        },
      },
    });
    wrapper = mount(AppToaster, {
      global: { plugins: [store, i18n] },
      attachTo: document.body,
    });
  });
  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
  });
  it("renders correctly and matches snapshot'", () => {
    expect(document.body.innerHTML).toMatchSnapshot();
  });
  it('renders toasts from store', async () => {
    await nextTick();
    await flushPromises();
    const toastEls = document.body.querySelectorAll('#toastTest');

    expect(toastEls).toHaveLength(2);
    expect(toastEls[0].textContent).toContain('Success message');
    expect(toastEls[1].textContent).toContain('Error message');
  });

  it('applies correct class for toast type', () => {
    const toastEls = document.body.querySelectorAll('.toast');
    expect(toastEls[0].classList).toContain('success');
    expect(toastEls[1].classList).toContain('error');
  });

  it('sets correct animationDuration for progress bar', () => {
    const progressEls = document.body.querySelectorAll('.toast-progress');
    expect(progressEls[0].getAttribute('style')).toContain('3000ms');
    expect(progressEls[1].getAttribute('style')).toContain('5000ms');
  });

  it('calls deleteToast action when delete button clicked', async () => {
    // Ищем кнопки удаления в body
    const deleteButtons = document.body.querySelectorAll<HTMLDivElement>('.toast-delete');

    expect(deleteButtons).toHaveLength(2); // убеждаемся, что нашли обе

    // Кликаем по первой
    deleteButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Ждём обновления Vue
    await wrapper.vm.$nextTick();

    expect(actions.deleteToast).toHaveBeenCalledWith(expect.any(Object), { id: 1 });
  });

  it('returns correct icon for each type', () => {
    const vm = wrapper.vm as any;
    expect(vm.iconClass('success')).toEqual(['fas', 'check-circle']);
    expect(vm.iconClass('error')).toEqual(['fas', 'times-circle']);
    expect(vm.iconClass('info')).toEqual(['fas', 'info-circle']);
    expect(vm.iconClass('warning')).toEqual(['fas', 'exclamation-triangle']);
    expect(vm.iconClass('unknown')).toEqual(['fas', 'times-circle']);
  });
});
