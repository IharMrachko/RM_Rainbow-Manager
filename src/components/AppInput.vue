<template>
  <label v-if="isPlaceholder" class="label" :for="type">{{ label }}</label>
  <div class="wrap-input">
    <input :id="type" class="input100" :type="type" :placeholder="placeholder" />
    <span class="focus-input100"></span>
    <span class="symbol-input100">
      <font-awesome-icon :icon="icon" />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HelloWorld',
  props: {
    isPlaceholder: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    label: {
      type: String,
      default: 'text',
    },
    icon: {
      // сюда передаём ['fas', 'envelope'] или ['fas', 'user']
      type: [Array, String],
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>
<style scoped lang="scss">
.label {
  text-align: left;
  padding: 0 1rem 0.4rem 1rem;
  font-weight: bold;
  font-size: 18px;
}
.wrap-input {
  position: relative;
  width: 300px;
}

input {
  outline: none;
  border: none;
}

.input100 {
  font-family: Poppins-Medium, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #666;
  display: block;
  width: 100%;
  background: #e6e6e6;
  height: 50px;
  border-radius: 25px;
  padding: 0 30px 0 68px;
  position: relative;
  z-index: 1;
}

/* Подложка для свечения */
.focus-input100 {
  display: block;
  position: absolute;
  border-radius: 25px;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.symbol-input100 {
  font-size: 15px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  align-items: center;
  position: absolute;
  border-radius: 25px;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding-left: 35px;
  pointer-events: none;
  color: #666666;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
  transition: all 0.4s;
  z-index: 1;
}

/* Запуск анимации при фокусе */
:deep(.input100:focus + .focus-input100) {
  animation: glow-fade 0.8s ease-in-out forwards;
}

:deep(.input100:focus) ~ .symbol-input100 {
  color: #57b846;
}

/* Кадры анимации */
@keyframes glow-fade {
  0% {
    box-shadow: 0 0 0 0 rgba(87, 184, 70, 0);
  }
  10% {
    box-shadow: 0 0 25px 10px rgba(87, 184, 70, 1); /* пик яркости */
  }
  100% {
    box-shadow: 0 0 0 0 rgba(87, 184, 70, 0); /* полное затухание */
  }
}

/* Плавное исчезновение placeholder */
.input100:focus::placeholder {
  color: transparent;
  transition: color 0.3s ease;
}
</style>
