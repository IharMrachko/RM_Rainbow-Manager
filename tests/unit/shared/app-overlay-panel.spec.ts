import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import { mount } from '@vue/test-utils';

describe('AppOverlayPanel', () => {
  let targetEl: HTMLElement;
  beforeEach(() => {
    targetEl = document.createElement('div');
    document.body.appendChild(targetEl);
    targetEl.getBoundingClientRect = () =>
      ({ top: 100, left: 100, width: 50, height: 50, right: 150, bottom: 150 } as DOMRect);
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it('renders when visible = true', () => {
    const wrapper = mount(AppOverlayPanel, {
      attachTo: document.body, // чтобы события и размеры работали корректно
      props: { target: targetEl, visible: true },
    });

    const el = document.body.querySelector('.overlay') as HTMLElement | null;
    expect(el).not.toBeNull();
    wrapper.unmount();
  });

  it('not renders when visible = false', () => {
    const wrapper = mount(AppOverlayPanel, {
      attachTo: document.body, // чтобы события и размеры работали корректно
      props: { target: targetEl, visible: false },
    });

    const el = document.body.querySelector('.overlay') as HTMLElement | null;
    expect(el).toBeNull();
    wrapper.unmount();
  });
  it('emmit update:visible click outside', () => {
    const wrapper = mount(AppOverlayPanel, {
      attachTo: document.body,
      props: { target: targetEl, visible: true },
    });

    document.body.click();

    expect(wrapper.emitted('update:visible')).toBeTruthy();
    expect(wrapper.emitted('update:visible')![0]).toEqual([false]);
    wrapper.unmount();
  });

  it('do not emmit update:visible click inside panel', () => {
    const wrapper = mount(AppOverlayPanel, {
      attachTo: document.body,
      props: { target: targetEl, visible: false },
    });

    const overlay = document.body.querySelector('.overlay') as HTMLElement | null;
    overlay?.click();

    expect(wrapper.emitted('update:visible')).toBeFalsy();
    wrapper.unmount();
  });
  it('применяет стили позиционирования', () => {
    const wrapper = mount(AppOverlayPanel, {
      attachTo: document.body,
      props: { target: targetEl, visible: true },
      position: { x: 'center', y: 'top' },
    });

    const style = (document.body.querySelector('.overlay') as HTMLElement).style;
    expect(style.position).toBe('absolute');
    expect(style.top).toBe('100px'); // например, если позиция bottom
    expect(style.left).toBe('125px');
    expect(style.transform).toContain('translateX(-50%)');
    wrapper.unmount();
  });
});
