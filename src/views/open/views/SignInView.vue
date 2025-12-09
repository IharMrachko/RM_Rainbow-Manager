<template>
  <section class="container">
    <div class="wrap-login">
      <app-image-login></app-image-login>
      <div class="login-form">
        <h1 class="title">{{ t('login') }}</h1>
        <!--        v-slot="{ meta }"-->
        <VForm :validation-schema="formGroup" @submit="onSubmit">
          <section class="login-inputs">
            <Field v-slot="{ field, meta, errorMessage }" name="email">
              <app-input
                v-bind="field"
                v-model="email"
                placeholder="example@gmail.com"
                label="email"
                :icon="['fas', 'envelope']"
                :z-index-tooltip="8"
                :error="meta.touched ? errorMessage : ''"
                type="email"
                @focus="focusInput"
                @blur="focusOutInput"
              ></app-input>
            </Field>
            <Field v-slot="{ field, meta, errorMessage }" name="password">
              <div class="btn-password">
                <app-input
                  v-bind="field"
                  v-model="password"
                  placeholder="password"
                  label="password"
                  :type="typeInput"
                  :z-index-tooltip="8"
                  :icon="['fas', 'lock']"
                  :error="meta.touched ? errorMessage : ''"
                  @focus="focusInput"
                  @blur="focusOutInput"
                ></app-input>
                <div class="icon-eye" @click="toggleEye">
                  <font-awesome-icon :icon="eyeIcon" />
                </div>
              </div>
            </Field>
          </section>
          <app-button :loading="loading" type="submit" title="login"></app-button>
        </VForm>

        <section>
          <div class="text-center">
            <span class="txt1">{{ t('forgot') }}</span>
            <router-link class="txt2" :to="{ name: 'forgot' }">
              {{ t('userName') }} / {{ t('password') }}?
            </router-link>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import * as yup from 'yup';
import { Field, Form as VForm } from 'vee-validate';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppImageLogin from '@/shared/components/AppImageLogin.vue';
import { usePasswordToggle } from '@/composables/usePasswordToggle';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: { AppImageLogin, Field, VForm, AppInput, AppButton },

  setup() {
    const router = useRouter();
    const store = useStore();
    const { t } = useI18n();
    const email = ref('');
    const password = ref('');
    const { typeInput, eyeIcon, toggleEye } = usePasswordToggle();
    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const focus: Map<string, boolean> = new Map<string, boolean>();
    const formGroup = yup.object({
      email: yup.string().required('validation.required').email('validation.invalidEmail'),
      password: yup
        .string()
        .required('validation.required')
        .min(6, { key: 'validation.min', values: { count: 6 } }),
    });

    const onSubmit = async (form: { email: string; password: string }) => {
      try {
        await store.dispatch('authFirebase/login', form);
        await router.push('/main');
      } catch (e) {
        console.error(e);
      }
    };

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
        focus.set('focus', true);
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        focus.set('focus', false);
        setTimeout(() => {
          if (!focus.get('focus')) {
            iNoBounce.disable();
            setTimeout(() => window.scrollTo(0, 0), 50);
          }
        }, 100);
      }
    };

    return {
      formGroup,
      onSubmit,
      email,
      password,
      loading,
      t,
      typeInput,
      eyeIcon,
      toggleEye,
      focusInput,
      focusOutInput,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 1rem; // чтобы на маленьких экранах не прилипало к краям
  @media (max-width: 600px) {
    padding: 0;
    align-items: center;
  }
}

.wrap-login {
  width: 100%;
  max-width: 960px;
  background: var(--color-wrap-bg);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;
  height: 80vh;
  margin-top: 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    height: 100dvh;
    border-radius: 0;
    margin-top: 0;
  }
}

.login-form {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: 3rem;

  @media (max-width: 600px) {
    width: 100%;
    gap: 1rem;
  }
}

.login-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 3rem;

  @media (max-width: 480px) {
    gap: 1rem;
    margin-bottom: 2rem;
  }
}

.title {
  font-size: 2rem;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
}

.txt1 {
  font-size: 13px;
  line-height: 1.5;
  color: #999999;
  margin-right: 0.5rem;
}

a {
  font-size: 14px;
  line-height: 1.7;
  color: #666666;
  margin: 0;
  text-decoration: none;
  transition: all 0.4s;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
}

a:hover {
  color: #57b846;
}

.text-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-password {
  position: relative;

  & .icon-eye {
    position: absolute;
    top: 40px;
    z-index: 8;
    right: 25px;
    color: #000;
  }
}
</style>
