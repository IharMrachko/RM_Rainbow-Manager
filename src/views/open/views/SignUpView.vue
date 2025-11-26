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
          :clickable="true"
          :linear="true"
          :show-panel="true"
        >
          <template #panel="{ index }">
            <div class="current-step">
              <VForm :validation-schema="formGroup" @submit="onSubmit">
                <section class="signUp-inputs">
                  <Field v-slot="{ field, meta, errorMessage }" name="firstName">
                    <app-input
                      v-show="index === 0"
                      v-bind="field"
                      v-model="firstName"
                      label="firstName"
                      placeholder="firstName"
                      :icon="['fas', 'pencil']"
                      :z-index-tooltip="1020"
                      :error="meta.touched ? errorMessage : ''"
                      type="email"
                    ></app-input>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="lastName">
                    <app-input
                      v-show="index === 0"
                      v-bind="field"
                      v-model="lastName"
                      label="lastName"
                      placeholder="lastName"
                      :icon="['fas', 'pencil']"
                      :error="meta.touched ? errorMessage : ''"
                    ></app-input>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="birthDate">
                    <app-input
                      v-show="index === 0"
                      v-bind="field"
                      v-model="birthDate"
                      label="birthDate"
                      placeholder="birthDateMask"
                      :icon="['fas', 'birthday-cake']"
                      :error="meta.touched ? errorMessage : ''"
                    ></app-input>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="email">
                    <app-input
                      v-show="index === 1"
                      v-bind="field"
                      v-model="email"
                      placeholder="example@gmail.com"
                      label="email"
                      :icon="['fas', 'envelope']"
                      :z-index-tooltip="1020"
                      :error="meta.touched ? errorMessage : ''"
                      type="email"
                    ></app-input>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="password">
                    <app-input
                      v-show="index === 1"
                      v-bind="field"
                      v-model="password"
                      placeholder="password"
                      label="password"
                      type="password"
                      :icon="['fas', 'lock']"
                      :error="meta.touched ? errorMessage : ''"
                    ></app-input>
                  </Field>
                  <Field v-slot="{ field, meta, errorMessage }" name="confirmPassword">
                    <app-input
                      v-show="index === 1"
                      v-bind="field"
                      v-model="confirmPassword"
                      placeholder="confirmPassword"
                      label="confirmPassword"
                      type="password"
                      :icon="['fas', 'lock']"
                      :error="meta.touched ? errorMessage : ''"
                    ></app-input>
                  </Field>
                </section>

                <!--          :disabled="!meta.valid"-->
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

export default defineComponent({
  components: { AppImageLogin, AppStepper, Field, VForm, AppInput, AppButton },

  setup() {
    const idx = ref(0);
    const steps = [
      { id: 's2', title: 'Profile' },
      { id: 's3', title: 'Confirm' },
    ];
    const router = useRouter();
    const store = useStore();
    const { t } = useI18n();
    const firstName = ref('');
    const lastName = ref('');
    const birthDate = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const loading = computed(() => store.getters['authFirebase/isLoading']);

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

      email: yup.string().required('validation.required').email('validation.invalidEmail'),
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
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; // чтобы на маленьких экранах не прилипало к краям
  @media (max-width: 600px) {
    padding: 0;
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

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    border-radius: 0;
    height: 100vh;
  }
}

.signUp-form {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: 3rem;

  @media (max-width: 768px) {
    width: 100%;
    gap: 2rem;
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
</style>
