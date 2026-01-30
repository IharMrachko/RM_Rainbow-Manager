<template>
  <section class="container">
    <div class="wrap-login">
      <app-image-login></app-image-login>
      <div class="login-form">
        <h1 class="title">{{ t('login') }}</h1>
        <VForm :validation-schema="formGroup" @submit="onSubmit">
          <section class="login-inputs">
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
          </section>
          <div class="actions-btn">
            <app-button :loading="loading" type="submit" title="login"></app-button>
            <app-button
              raised
              severity="gradient"
              title="loginWithGoogle"
              :icon="['fab', 'google']"
              :loading="loadingGoogle"
              @click="
                $event.preventDefault();
                loginWithGoogle();
              "
            ></app-button>
          </div>
        </VForm>

        <section>
          <div class="text-center">
            <span class="txt1">{{ t('forgot') }}</span>
            <router-link class="txt2" :to="{ name: 'forgot' }"> {{ t('password') }}? </router-link>
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
import { useErrorMessage } from '@/composables/useError';

export default defineComponent({
  components: { AppImageLogin, Field, VForm, AppInput, AppButton },

  setup() {
    const router = useRouter();
    const store = useStore();
    const { t } = useI18n();
    const email = ref('');
    const password = ref('');
    const { typeInput, eyeIcon, toggleEye } = usePasswordToggle();
    const { errorValue } = useErrorMessage();
    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const loadingGoogle = computed(() => store.getters['authFirebase/isLoadingGoogle']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const focus: Map<string, boolean> = new Map<string, boolean>();
    const formGroup = yup.object({
      email: yup.string().required('validation.required').email('validation.email'),
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
        focus.set('focus', true);
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        focus.set('focus', false);
        setTimeout(() => {
          if (!focus.get('focus')) {
            window.scrollTo(0, 0);
          }
        }, 50);
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
      typeInput,
      eyeIcon,
      toggleEye,
      focusInput,
      focusOutInput,
      errorValue,
      loginWithGoogle,
      loadingGoogle,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
  @media (max-width: 600px) {
    padding: 0;
    height: calc(100vh - var(--header-height));
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
    border-radius: 0;
    margin-top: 0;
    padding: 1.5rem;
    height: calc(100vh + 100px);
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
