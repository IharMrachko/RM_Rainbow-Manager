<script setup lang="ts">
import AppInput from '@/components/AppInput.vue';
import AppButton from '@/components/AppButton.vue';
</script>

<template>
  <section class="container">
    <div class="wrap-login">
      <div class="login-pic"></div>
      <div class="login-form">
        <h1 class="title">Login</h1>
        <section class="login-inputs">
          <app-input
            placeholder="example@gmail.com"
            label="Email"
            :icon="['fas', 'envelope']"
          ></app-input>
          <app-input
            placeholder="password"
            label="Password"
            type="password"
            :icon="['fas', 'lock']"
          ></app-input>
        </section>

        <app-button></app-button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-135deg, #c850c0, #4158d0);
}
.wrap-login {
  width: 960px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem 130px 33px 95px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.login-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
</style>
