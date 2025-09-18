<script setup lang="ts"></script>

<template>
  <div class="container-btn">
    <button class="btn">Login</button>
  </div>
</template>

<style scoped lang="scss">
button {
  outline: none !important;
  border: none;
  background: transparent;
}

.btn {
  font-weight: bold;
  font-size: 15px;
  line-height: 1.5;
  color: #fff;
  text-transform: uppercase;
  width: 100%;
  height: 50px;
  border-radius: 25px;
  background: #57b846;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 25px;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
  transition: all 0.4s;
}

.btn:hover {
  cursor: pointer;
  background: #333333;
}
</style>
