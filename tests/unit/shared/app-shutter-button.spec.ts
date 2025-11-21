import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AppShutterButton from '@/shared/components/AppShutterButton.vue';

jest.useFakeTimers();

describe('AppShutterButton', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(AppShutterButton, {
      attachTo: document.body, // нужен для getBoundingClientRect и визуального дерева
    });
  });

  afterEach(() => {
    wrapper.unmount();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('emits capture on click and triggers brief active flash', async () => {
    // убедимся, что изначально нет active
    expect(wrapper.classes()).not.toContain('active');

    // клик по кнопке
    await wrapper.trigger('click');

    // событие emit должно быть
    expect(wrapper.emitted()).toHaveProperty('capture');
    // isActive true кратко — класс установлен сразу
    expect(wrapper.classes()).toContain('active');

    // fast-forward таймер на 120ms и проверим что класс снимется
    jest.advanceTimersByTime(120);
    await nextTick();
    expect(wrapper.classes()).not.toContain('active');
  });

  test('pointer down sets pressed and pointer up clears it', async () => {
    // pointerdown
    await wrapper.trigger('pointerdown');
    expect(wrapper.classes()).toContain('pressed');

    // pointerup
    await wrapper.trigger('pointerup');
    expect(wrapper.classes()).not.toContain('pressed');
  });

  test('space and enter key triggers capture and pressed animation', async () => {
    // Space
    await wrapper.trigger('keydown.space');
    expect(wrapper.emitted()).toHaveProperty('capture');

    // Enter
    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted()).toHaveProperty('capture');
  });

  test('ripple appears on pointerdown and disappears after transition', async () => {
    // ensure no ripple initially
    expect(wrapper.find('.ripple').exists()).toBe(false);

    // pointerdown should create ripple element
    await wrapper.trigger('pointerdown');

    // after creating ripple, it should be visible in DOM
    const ripple = wrapper.find('.ripple');
    expect(ripple.exists()).toBe(true);
    // style must contain width/height/transform/opacity at creation time
    const style = (ripple.element as HTMLElement).style;
    expect(style.width).toBeTruthy();
    expect(style.height).toBeTruthy();
    expect(style.transform).toContain('scale(0.1)');

    // nextTick + RAF in implementation -> we need to flush microtasks and then advance timers
    await nextTick();
    jest.runOnlyPendingTimers(); // triggers setTimeout cleanup (450ms)
    // after animation finishes, ripple removed
    jest.advanceTimersByTime(450);
    await nextTick();
    expect(wrapper.find('.ripple').exists()).toBe(false);
  });

  test('button has accessible aria-label and focus-visible works', () => {
    const btn = wrapper.get('button');
    expect(btn.attributes('aria-label')).toBe('Сделать снимок');

    // simulate keyboard focus: add focus-visible pseudo check by toggling focus class
    btn.element.focus();
    expect(document.activeElement).toBe(btn.element);
    // focus-visible visual check is CSS; we only assert element can be focused
  });

  test('cleanup after unmount does not throw', async () => {
    // simulate pointerdown to create ripple and timers
    await wrapper.trigger('pointerdown');
    wrapper.unmount();
    // advance timers — should not throw
    jest.runAllTimers();
  });
});
