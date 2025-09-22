<template>
  <section class="container">
    <div class="wrap-login">
      <div class="login-pic" @mousemove="handleMouseMove" @mouseleave="resetTransform">
        <img ref="imageRef" src="../assets/img-01.png" alt="" />
      </div>
      <div class="login-form">
        <h1 class="title">Login</h1>
        <!--        v-slot="{ meta }"-->
        <VForm :validation-schema="formGroup" @submit="onSubmit">
          <section class="login-inputs">
            <Field v-slot="{ field, meta, errorMessage }" name="email">
              <app-input
                v-bind="field"
                v-model="email"
                placeholder="example@gmail.com"
                label="Email"
                :icon="['fas', 'envelope']"
                :z-index-tooltip="1020"
                :error="meta.touched ? errorMessage : ''"
                type="email"
              ></app-input>
            </Field>
            <Field v-slot="{ field, meta, errorMessage }" name="password">
              <app-input
                v-bind="field"
                v-model="password"
                placeholder="password"
                label="Password"
                type="password"
                :icon="['fas', 'lock']"
                :error="meta.touched ? errorMessage : ''"
              ></app-input>
            </Field>
          </section>
          <!--          :disabled="!meta.valid"-->
          <app-button :loading="loading" type="submit" title="Login"></app-button>
        </VForm>

        <section>
          <div class="text-center">
            <span class="txt1">Forgot</span>
            <router-link class="txt2" :to="{ name: 'forgot' }"> Username / Password? </router-link>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppButton from '@/components/shared/AppButton.vue';
import AppInput from '@/components/shared/AppInput.vue';
import * as yup from 'yup';
import { Field, Form as VForm } from 'vee-validate';

export default defineComponent({
  components: { Field, VForm, AppInput, AppButton },

  setup() {
    const imageRef = ref<HTMLImageElement | null>(null);
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const formGroup = yup.object({
      email: yup.string().required('This field is required').email('Incorrect email'),
      password: yup.string().required('This field is required').min(6, 'Minimum 6 characters'),
    });

    const onSubmit = (values: Record<string, any>) => {
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        values;
      }, 3000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const el = imageRef.value;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // позиция курсора внутри картинки
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // нормализуем в диапазон [-1, 1]
      const rotateY = ((x - centerX) / centerX) * 10; // 10° — максимальный поворот по Y
      const rotateX = -((y - centerY) / centerY) * 10; // по X инвертируем

      el.style.transform = `perspective(300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const resetTransform = () => {
      if (imageRef.value) {
        imageRef.value.style.transform = 'perspective(300px) rotateX(0deg) rotateY(0deg)';
      }
    };
    return {
      formGroup,
      onSubmit,
      email,
      password,
      loading,
      imageRef,
      handleMouseMove,
      resetTransform,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-135deg, #c850c0, #4158d0);
  padding: 1rem; // чтобы на маленьких экранах не прилипало к краям
}

.wrap-login {
  width: 100%;
  max-width: 960px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
  }
}

.login-pic {
  flex: 1 1 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 300px;

  img {
    max-width: 100%;
    height: auto;
    transition: transform 0.1s ease;
    will-change: transform;
  }

  @media (max-width: 768px) {
    flex: none;
    width: 80%;
    margin-bottom: 1.5rem;
  }
}

.login-form {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: 3rem;

  @media (max-width: 768px) {
    width: 100%;
    gap: 2rem;
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
</style>
