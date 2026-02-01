<template>
  <section class="container">
    <div class="wrap-signUp">
      <app-image-login></app-image-login>
      <div class="signUp-form">
        <h1 class="title">{{ t('signUp') }}</h1>
        <VForm v-slot="{ meta: formMeta }" :validation-schema="formGroup" @submit="onSubmit">
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
            <div v-if="showRecaptcha" id="recaptcha-container" class="recaptcha-container"></div>
          </section>
          <div class="actions-btn">
            <app-button
              :loading="loading"
              type="submit"
              title="signUp"
              :disabled="!formMeta.valid || !formMeta.dirty || !isRecaptchaReady"
            ></app-button>
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
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
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
// Импортируем Firebase
import {
  getAuth,
  RecaptchaVerifier,
  RecaptchaVerifier as FirebaseRecaptchaVerifier,
} from 'firebase/auth';

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

    // Добавляем состояния для reCAPTCHA
    const showRecaptcha = ref(true);
    const isRecaptchaReady = ref(false);
    const recaptchaVerifier = ref<FirebaseRecaptchaVerifier | null>(null);

    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const loadingGoogle = computed(() => store.getters['authFirebase/isLoadingGoogle']);
    const device = computed(() => store.getters['mobile/getDevice']);

    // Расширяем схему валидации для reCAPTCHA
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

    // Инициализация reCAPTCHA
    // Исправленная функция initializeRecaptcha:
    const initializeRecaptcha = () => {
      try {
        const auth = getAuth();

        // Очищаем предыдущую reCAPTCHA если есть
        if (recaptchaVerifier.value) {
          recaptchaVerifier.value.clear();
        }

        // ПРАВИЛЬНЫЙ ПОРЯДОК АРГУМЕНТОВ:
        // 1. Auth instance
        // 2. Container ID или элемент
        // 3. Параметры
        recaptchaVerifier.value = new RecaptchaVerifier(
          auth, // Первый параметр - Auth instance
          'recaptcha-container', // Второй параметр - ID контейнера
          {
            size: 'normal', // 'normal', 'compact', 'invisible'
            callback: () => {
              //reCAPTCHA успешно пройдена
              isRecaptchaReady.value = true;
            },
            'expired-callback': () => {
              //reCAPTCHA истекла
              isRecaptchaReady.value = false;
              store.dispatch('toast/addToast', {
                message: 'reCAPTCHAHasExpired',
                severity: 'warning',
              });
              resetRecaptcha();
            },
            'error-callback': (error: unknown) => {
              console.error('reCAPTCHA ошибка:', error);
              store.dispatch('toast/addToast', {
                message: 'reCAPTCHAInitializationError',
                severity: 'error',
              });
              isRecaptchaReady.value = false;
            },
          }
        );

        // Рендерим виджет
        recaptchaVerifier.value.render().then(() => {
          //reCAPTCHA виджет отрендерен
        });
      } catch (error) {
        console.error('Ошибка инициализации reCAPTCHA:', error);
        store.dispatch('toast/addToast', {
          message: 'reCAPTCHAInitializationError',
          severity: 'error',
        });
      }
    };

    // Сброс reCAPTCHA
    const resetRecaptcha = () => {
      if (recaptchaVerifier.value) {
        recaptchaVerifier.value.clear();
        isRecaptchaReady.value = false;
        // Переинициализируем через небольшую задержку
        setTimeout(() => {
          initializeRecaptcha();
        }, 500);
      }
    };

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
        resetRecaptcha();
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
        resetRecaptcha();
      }
    };

    // Инициализируем reCAPTCHA при монтировании компонента
    onMounted(async () => {
      // Ждем следующего тика обновления DOM
      await nextTick();
      initializeRecaptcha();
    });
    // Очищаем reCAPTCHA при размонтировании
    onUnmounted(() => {
      if (recaptchaVerifier.value) {
        recaptchaVerifier.value.clear();
      }
    });

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
      loadingGoogle,
      showRecaptcha,
      isRecaptchaReady,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: auto;
  @media (max-width: 600px) {
    padding: 0;
    height: calc(100vh - var(--header-height));
  }
}

.wrap-signUp {
  width: 100%;
  background: var(--color-wrap-bg);
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    border-radius: 0;
    height: calc(100vh + 150px); // Увеличиваем высоту для reCAPTCHA
    margin-top: 0;
  }
}

.signUp-form {
  flex: 1 1 40%;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 600px) {
    width: 100%;
    gap: 1rem;
  }
}

.signUp-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1rem; // Уменьшили отступ для места под reCAPTCHA

  @media (max-width: 600px) {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  & .input-wrapper {
    position: relative;
  }
}

.title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    font-size: 1.5rem;
    margin-bottom: 30px; // Уменьшили отступ
  }
}

// Стили для контейнера reCAPTCHA
.recaptcha-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  min-height: 78px; // Минимальная высота для reCAPTCHA

  & > div {
    transform: scale(0.9); // Можно настроить масштаб
    transform-origin: center;
  }

  @media (max-width: 600px) {
    transform: scale(0.85);
    margin: 0.5rem 0;
  }
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
