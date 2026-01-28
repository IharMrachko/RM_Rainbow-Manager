<template>
  <section class="container">
    <div class="wrap-signUp">
      <app-image-login></app-image-login>
      <div class="signUp-form">
        <h1 class="title">{{ t('signUp') }}</h1>
        <VForm :validation-schema="formGroup" @submit="onSubmit">
          <section class="signUp-inputs">
            <Field v-slot="{ field, meta, errorMessage }" name="email">
              <div class="input-wrapper">
                <app-input
                  v-bind="field"
                  v-model="email"
                  placeholder="example@gmail.com"
                  label="email"
                  :icon="['fas', 'envelope']"
                  :error="meta.touched ? errorMessage : ''"
                  type="email"
                  @focus="focusInput"
                  @blur="focusOutInput"
                ></app-input>
                <div v-if="meta.touched && errorMessage" class="error-message">
                  {{ errorValue(errorMessage) }}
                </div>
              </div>
            </Field>
            <Field v-slot="{ field, meta, errorMessage }" name="password">
              <div class="btn-password">
                <app-input
                  v-bind="field"
                  v-model="password"
                  placeholder="password"
                  label="password"
                  :type="typeInput"
                  :icon="['fas', 'lock']"
                  :error="meta.touched ? errorMessage : ''"
                  @focus="focusInput"
                  @blur="focusOutInput"
                ></app-input>
                <div class="icon-eye" @click="toggleEye">
                  <font-awesome-icon :icon="eyeIcon" />
                </div>
                <div v-if="meta.touched && errorMessage" class="error-message">
                  {{ errorValue(errorMessage) }}
                </div>
              </div>
            </Field>
            <Field v-slot="{ field, meta, errorMessage }" name="confirmPassword">
              <div class="btn-password">
                <app-input
                  v-bind="field"
                  v-model="confirmPassword"
                  placeholder="password"
                  label="confirmPassword"
                  :type="typeInput"
                  :icon="['fas', 'lock']"
                  :error="meta.touched ? errorMessage : ''"
                  @focus="focusInput"
                  @blur="focusOutInput"
                ></app-input>
                <div class="icon-eye" @click="toggleEye">
                  <font-awesome-icon :icon="eyeIcon" />
                </div>
                <div v-if="meta.touched && errorMessage" class="error-message">
                  {{ errorValue(errorMessage) }}
                </div>
              </div>
            </Field>
          </section>
          <div class="actions-btn">
            <app-button :loading="loading" type="submit" title="signUp"></app-button>
            <app-button
              raised
              severity="gradient"
              title="loginWithGoogle"
              :icon="['fab', 'google']"
              @click="loginWithGoogle"
            ></app-button>
          </div>
        </VForm>
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
import { SignUp } from '@/store/modules/auth';
import { usePasswordToggle } from '@/composables/usePasswordToggle';
// @ts-ignore
import iNoBounce from 'inobounce';
import { useErrorMessage } from '@/composables/useError';

export default defineComponent({
  components: { AppImageLogin, Field, VForm, AppInput, AppButton },

  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const store = useStore();
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const { typeInput, eyeIcon, toggleEye } = usePasswordToggle();
    const { errorValue } = useErrorMessage();
    const focus: Map<string, boolean> = new Map<string, boolean>();
    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const formGroup = yup.object({
      email: yup.string().required('validation.required').email('validation.email'),
      password: yup
        .string()
        .required('validation.required')
        .min(6, { key: 'validation.min', values: { count: 6 } }),
      confirmPassword: yup
        .string()
        .required('validation.required')
        .oneOf([yup.ref('password')], 'validation.passwordsMatch'),
    });

    const onSubmit = async (form: SignUp) => {
      try {
        await store.dispatch('authFirebase/register', {
          email: form.email,
          password: form.password,
          role: 'USER',
        });
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

    const loginWithGoogle = async () => {
      try {
        await store.dispatch('authFirebase/loginWithGoogle');
        await router.push('/main');
      } catch (e) {
        console.error(e);
      }
    };

    return {
      formGroup,
      onSubmit,
      email,
      password,
      loading,
      t,
      confirmPassword,
      toggleEye,
      typeInput,
      eyeIcon,
      focusInput,
      focusOutInput,
      errorValue,
      loginWithGoogle,
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
    height: calc(100vh - var(--header-height)); // тут
  }
}

.wrap-signUp {
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
  margin-top: 20px;
  height: 80vh;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    border-radius: 0;
    height: calc(100vh + 100px); // тут
    margin-top: 0;
  }
}

.signUp-form {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: 3rem;

  @media (max-width: 768px) {
    width: 100%;
    gap: 1rem;
  }
}

.signUp-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 3rem;

  @media (max-width: 480px) {
    gap: 1rem;
    margin-bottom: 2rem;
  }

  & .input-wrapper {
    position: relative;
  }
}

.title {
  font-size: 2rem;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 50px;
  }
}

.current-step {
  width: 100%;
  height: 370px;
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

.error-message {
  position: absolute;
  color: rgb(200, 0, 0);
  font-size: 13px;
  font-weight: bold;
  right: 20px;
}

.actions-btn {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
