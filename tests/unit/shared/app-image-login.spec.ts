import { mount } from '@vue/test-utils';
import AppImageLogin from '@/shared/components/AppImageLogin.vue';

describe('AppImageLogin ', () => {
  it('applies transform on mouse move and resets on mouse leave', async () => {
    const wrapper = mount(AppImageLogin);
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
