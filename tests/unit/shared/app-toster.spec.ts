import { createStore } from 'vuex';
import { flushPromises, mount } from '@vue/test-utils';
import AppToaster from '@/components/shared/AppToaster.vue';
import { nextTick } from 'vue';

describe('AppToaster', () => {
  let store: any;
  let actions: any;
  let state: any;

  beforeEach(() => {
    actions = {
      deleteToast: jest.fn(),
    };
    state = {
      toast: {
        toasts: [
          { id: 1, message: 'Success message', type: 'success', duration: 3000 },
          { id: 2, message: 'Error message', type: 'error', duration: 5000 },
        ],
      },
    };
    store = createStore({
      modules: {
        toast: {
          namespaced: true,
          state: state.toast,
          actions,
        },
      },
    });
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it("renders correctly and matches snapshot'", () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
      attachTo: document.body,
    });
    expect(document.body.innerHTML).toMatchSnapshot();
    wrapper.unmount();
  });
  it('renders toasts from store', async () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
      attachTo: document.body,
    });

    await nextTick();
    await flushPromises();
    const toastEls = document.body.querySelectorAll('#toastTest');

    expect(toastEls).toHaveLength(2);
    expect(toastEls[0].textContent).toContain('Success message');
    expect(toastEls[1].textContent).toContain('Error message');
    wrapper.unmount();
  });

  it('applies correct class for toast type', () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
      attachTo: document.body,
    });
    const toastEls = document.body.querySelectorAll('.toast');
    expect(toastEls[0].classList).toContain('success');
    expect(toastEls[1].classList).toContain('error');
    wrapper.unmount();
  });

  it('sets correct animationDuration for progress bar', () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
      attachTo: document.body,
    });

    const progressEls = document.body.querySelectorAll('.toast-progress');
    expect(progressEls[0].getAttribute('style')).toContain('3000ms');
    expect(progressEls[1].getAttribute('style')).toContain('5000ms');
    wrapper.unmount();
  });

  it('calls deleteToast action when delete button clicked', async () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
      attachTo: document.body, // чтобы teleport рендерился в body
    });

    // Ищем кнопки удаления в body
    const deleteButtons = document.body.querySelectorAll<HTMLDivElement>('.toast-delete');

    expect(deleteButtons).toHaveLength(2); // убеждаемся, что нашли обе

    // Кликаем по первой
    deleteButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Ждём обновления Vue
    await wrapper.vm.$nextTick();

    expect(actions.deleteToast).toHaveBeenCalledWith(expect.any(Object), { id: 1 });

    wrapper.unmount(); // чистим body после теста
  });

  it('returns correct icon for each type', () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [store] },
    });
    const vm = wrapper.vm as any;
    expect(vm.iconClass('success')).toEqual(['fas', 'check-circle']);
    expect(vm.iconClass('error')).toEqual(['fas', 'times-circle']);
    expect(vm.iconClass('info')).toEqual(['fas', 'info-circle']);
    expect(vm.iconClass('warning')).toEqual(['fas', 'exclamation-triangle']);
    expect(vm.iconClass('unknown')).toEqual(['fas', 'times-circle']);
  });
});
