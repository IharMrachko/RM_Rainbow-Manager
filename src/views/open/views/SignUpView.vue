<template>
  <section class="container">
    <div class="wrap-signUp">
      <app-image-login></app-image-login>
      <div class="signUp-form">
        <h1 class="title">{{ t('signUp') }}</h1>
        <app-stepper
          v-model:active-index="idx"
          :steps="steps"
          orientation="horizontal"
          :clickable="isNextStep"
          :next-step="idx"
          :linear="true"
          :show-panel="true"
        >
          <template #panel="{ index }">
            <div class="current-step">
              <VForm :validation-schema="formGroup" @submit="onSubmit">
                <section class="signUp-inputs">
                  <Field v-slot="{ field, meta, errorMessage }" name="firstName">
                    <div v-show="index === 0" class="input-wrapper">
                      <app-input
                        v-bind="field"
                        v-model="firstName"
                        label="firstName"
                        placeholder="firstName"
                        :icon="['fas', 'pencil']"
                        :error="meta.touched && index === 0 ? errorMessage : ''"
                        type="text"
                        @focus="focusInput"
                        @blur="focusOutInput"
                      ></app-input>
                      <div v-if="meta.touched && errorMessage" class="error-message">
                        {{ errorValue(errorMessage) }}
                      </div>
                    </div>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="lastName">
                    <div v-show="index === 0" class="input-wrapper">
                      <app-input
                        v-bind="field"
                        v-model="lastName"
                        label="lastName"
                        placeholder="lastName"
                        :icon="['fas', 'pencil']"
                        :error="meta.touched && index === 0 ? errorMessage : ''"
                        @focus="focusInput"
                        @blur="focusOutInput"
                      ></app-input>
                      <div v-if="meta.touched && errorMessage" class="error-message">
                        {{ errorValue(errorMessage) }}
                      </div>
                    </div>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="birthDate">
                    <div v-show="index === 0" class="input-wrapper">
                      <app-input
                        v-bind="field"
                        v-model="birthDate"
                        label="birthDate"
                        placeholder="birthDateMask"
                        :icon="['fas', 'birthday-cake']"
                        :error="meta.touched && index === 0 ? errorMessage : ''"
                        @focus="focusInput"
                        @blur="focusOutInput"
                      ></app-input>
                      <div v-if="meta.touched && errorMessage" class="error-message">
                        {{ errorValue(errorMessage) }}
                      </div>
                    </div>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="email">
                    <div v-show="index === 1" class="input-wrapper">
                      <app-input
                        v-bind="field"
                        v-model="email"
                        placeholder="example@gmail.com"
                        label="email"
                        :icon="['fas', 'envelope']"
                        :error="meta.touched && index === 1 ? errorMessage : ''"
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
                    <div v-show="index === 1" class="btn-password">
                      <app-input
                        v-bind="field"
                        v-model="password"
                        placeholder="password"
                        label="password"
                        :type="typeInput"
                        :icon="['fas', 'lock']"
                        :error="meta.touched && index === 1 ? errorMessage : ''"
                        @focus="focusInput"
                        @blur="focusOutInput"
                      ></app-input>
                      <div v-show="index === 1" class="icon-eye" @click="toggleEye">
                        <font-awesome-icon :icon="eyeIcon" />
                      </div>
                      <div v-if="meta.touched && errorMessage" class="error-message">
                        {{ errorValue(errorMessage) }}
                      </div>
                    </div>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="confirmPassword">
                    <div v-show="index === 1" class="btn-password">
                      <app-input
                        v-bind="field"
                        v-model="confirmPassword"
                        placeholder="password"
                        label="confirmPassword"
                        :type="typeInput"
                        :icon="['fas', 'lock']"
                        :error="meta.touched && index === 1 ? errorMessage : ''"
                        @focus="focusInput"
                        @blur="focusOutInput"
                      ></app-input>
                      <div v-show="index === 1" class="icon-eye" @click="toggleEye">
                        <font-awesome-icon :icon="eyeIcon" />
                      </div>
                      <div v-if="meta.touched && errorMessage" class="error-message">
                        {{ errorValue(errorMessage) }}
                      </div>
                    </div>
                  </Field>
                </section>

                <app-button
                  v-if="index === 0"
                  :disabled="!isNextStep"
                  title="nextStep"
                  @click="nextStep"
                ></app-button>

                <app-button
                  v-if="index === 1"
                  :loading="loading"
                  type="submit"
                  title="signUp"
                ></app-button>
              </VForm>
            </div>
          </template>
        </app-stepper>
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
import AppStepper from '@/shared/components/AppStepper.vue';
import { parseDDMMYYYY } from '@/helpers/parser-date.helper';
import AppImageLogin from '@/shared/components/AppImageLogin.vue';
import { SignUp } from '@/store/modules/auth';
import { usePasswordToggle } from '@/composables/usePasswordToggle';

import { useErrorMessage } from '@/composables/useError';

export default defineComponent({
  components: { AppImageLogin, AppStepper, Field, VForm, AppInput, AppButton },

  setup() {
    const idx = ref(0);
    const { t } = useI18n();
    const steps = [
      { id: 's2', title: 'profile' },
      { id: 's3', title: 'confirmation' },
    ];
    const router = useRouter();
    const store = useStore();
    const firstName = ref('');
    const lastName = ref('');
    const birthDate = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const { typeInput, eyeIcon, toggleEye } = usePasswordToggle();
    const { errorValue } = useErrorMessage();
    const focus: Map<string, boolean> = new Map<string, boolean>();
    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const formGroup = yup.object({
      firstName: yup.string().required('validation.required'),
      lastName: yup.string().required('validation.required'),
      birthDate: yup
        .date()
        .transform((curr, orig) => {
          if (!orig) return null;
          const d = parseDDMMYYYY(orig as string);
          return d ? d : new Date('invalid');
        })
        .typeError('validation.invalidDate')
        .required('validation.required'),

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
          firstName: form.firstName,
          lastName: form.lastName,
          birthDate: parseDDMMYYYY(form.birthDate),
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
        // iNoBounce.enable();
        focus.set('focus', true);
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        focus.set('focus', false);
        // setTimeout(() => {
        //   if (!focus.get('focus')) {
        //     iNoBounce.disable();
        //     setTimeout(() => window.scrollTo(0, 0), 50);
        //   }
        // }, 100);
      }
    };

    const isNextStep = computed(() => {
      return (
        firstName.value.trim() !== '' &&
        lastName.value.trim() !== '' &&
        birthDate.value.trim() !== '' &&
        parseDDMMYYYY(birthDate.value as string) !== null
      );
    });

    const nextStep = () => {
      if (isNextStep.value) {
        idx.value = 1;
      }
    };

    return {
      formGroup,
      onSubmit,
      email,
      password,
      loading,
      t,
      idx,
      steps,
      firstName,
      lastName,
      birthDate,
      confirmPassword,
      toggleEye,
      typeInput,
      eyeIcon,
      focusInput,
      focusOutInput,
      isNextStep,
      errorValue,
      nextStep,
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
</style>
