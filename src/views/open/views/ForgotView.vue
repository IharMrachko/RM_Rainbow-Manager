<template>
  <section class="container">
    <div class="wrap-login">
      <app-image-login></app-image-login>
      <div class="login-form">
        <h1 class="title">{{ t('resetPassword') }}</h1>
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
                  @blur="focusOutInput"
                ></app-input>
                <div v-if="meta.touched && errorMessage" class="error-message">
                  {{ errorValue(errorMessage) }}
                </div>
              </div>
            </Field>
          </section>
          <app-button :loading="loading" type="submit" title="send"></app-button>
        </VForm>

        <section>
          <router-link class="txt2" :to="{ name: 'signIn' }">
            <font-awesome-icon size="sm" :icon="['fas', 'arrow-left']" />
            {{ t('goBack') }}
          </router-link>
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
import AppImageLogin from '@/shared/components/AppImageLogin.vue';
import { usePasswordToggle } from '@/composables/usePasswordToggle';
import { useErrorMessage } from '@/composables/useError';

export default defineComponent({
  components: { AppImageLogin, Field, VForm, AppInput, AppButton },

  setup() {
    const store = useStore();
    const { t } = useI18n();
    const email = ref('');
    const password = ref('');
    const { typeInput, eyeIcon, toggleEye } = usePasswordToggle();
    const { errorValue } = useErrorMessage();
    const loading = computed(() => store.getters['authFirebase/isLoading']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const formGroup = yup.object({
      email: yup.string().required('validation.required').email('validation.email'),
    });

    const onSubmit = async (form: { email: string }) => {
      try {
        await store.dispatch('authFirebase/resetPassword', form.email);
      } catch (e) {
        console.error(e);
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 50);
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
      focusOutInput,
      errorValue,
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
    height: 100dvh;
  }
}

.wrap-login {
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
    border-radius: 0;
    margin-top: 0;
    padding: 1.5rem;
    height: 100dvh;
  }
}

.login-form {
  flex: 1 1 40%;
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

.error-message {
  position: absolute;
  color: rgb(200, 0, 0);
  font-size: 13px;
  font-weight: bold;
  right: 20px;
}
</style>
