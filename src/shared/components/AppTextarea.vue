<template>
  <div class="textarea-wrapper">
    <section class="area-image" :class="{ fly: urlRef }">
      <div v-if="urlRef" class="image">
        <img :src="urlRef" alt="image" />
        <div class="icon" @click="clearImage">
          <font-awesome-icon size="sm" :icon="['fas', 'fa-times']" />
        </div>
      </div>
    </section>
    <textarea
      id="textarea"
      v-model="textareaRef"
      :placeholder="t('writeSomething')"
      class="textarea__field"
      @blur="handleBlur"
      @focus="focus"
    ></textarea>
    <span class="focus-input100"></span>
    <section class="area-actions">
      <app-file-uploader
        :is-show-sign="false"
        :is-title="false"
        @select="onFileSelected"
      ></app-file-uploader>
      <div class="btn">
        <app-button
          severity="secondary"
          :icon="['fas', 'arrow-up']"
          raised
          :loading="loader"
          @click="apply"
        ></app-button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, ref } from 'vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: {
    AppFileUploader,
    AppButton,
  },
  props: {
    label: { type: String, default: '' },
    loader: { type: Boolean, default: false },
  },
  emits: ['apply', 'focus', 'blur'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const textareaRef = ref('');
    const urlRef = ref('');
    let base64Data: string = '';
    const onFileSelected = async (file: File) => {
      if (!file) return;
      urlRef.value = URL.createObjectURL(file);
      await toBase64(file);
    };

    const toBase64 = (file: File) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // убираем префикс "data:image/jpeg;base64,"
          base64Data = result.split(',')[1];
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const clearImage = () => {
      urlRef.value = '';
    };

    const apply = () => {
      emit('apply', {
        text: textareaRef.value,
        url: urlRef.value,
        base64Data: base64Data,
      });
      textareaRef.value = '';
      urlRef.value = '';
    };

    onBeforeUnmount(() => {
      if (urlRef.value) {
        URL.revokeObjectURL(urlRef.value);
      }
    });

    const focus = () => {
      emit('focus');
    };

    const handleBlur = () => {
      emit('blur');
    };

    return {
      textareaRef,
      onFileSelected,
      urlRef,
      clearImage,
      apply,
      t,
      focus,
      handleBlur,
    };
  },
});
</script>

<style scoped>
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  width: inherit;
  border-radius: 25px;
  background: #e6e6e6;

  & .area-image {
    padding: 15px;
    border-bottom: 1px solid #ccc;

    & .image {
      position: relative;
      width: 100px;
      height: 140px;

      & .icon {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        height: 25px;
        width: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        color: black;
      }
    }

    & img {
      object-fit: contain;
      border-radius: 0.75rem;
    }
  }

  & .area-actions {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    background: radial-gradient(
      circle,
      rgba(255, 0, 0, 0.5) 0%,
      /* красный */ rgba(255, 165, 0, 0.5) 15%,
      /* оранжевый */ rgba(255, 255, 0, 0.5) 30%,
      /* жёлтый */ rgba(0, 128, 0, 0.5) 45%,
      /* зелёный */ rgba(0, 0, 255, 0.5) 60%,
      /* синий */ rgba(75, 0, 130, 0.5) 75%,
      /* индиго */ rgba(238, 130, 238, 0.5) 90%,
      /* фиолетовый */ transparent 100%
    );

    border-bottom-left-radius: 25px;
    border-bottom-right-radius: 25px;
  }
}

textarea {
  outline: none;
  border: none;
}

.textarea__field {
  font-family: Poppins-Medium, sans-serif;
  font-size: 17px;
  line-height: 1.5;
  color: #666;
  display: block;
  width: 100%;
  background: #e6e6e6;
  padding: 15px;
  position: relative;
  z-index: 1;
  resize: none;
  height: 120px;
  overflow: auto;
}
.textarea__field.pr {
  padding: 0 30px 0 68px;
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

/* Запуск анимации при фокусе */
:deep(.textarea__field:focus + .focus-input100) {
  animation: glow-fade 0.8s ease-in-out forwards;
}

:deep(.textarea__field:focus) ~ .symbol-input100 {
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
.textarea__field:focus::placeholder {
  color: transparent;
  transition: color 0.3s ease;
}
.validate-input {
  position: relative;
}

.textarea__field:disabled {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.5;
}

.textarea__field::placeholder {
  text-transform: lowercase;
}

.area-image.fly {
  position: absolute;
  bottom: 200px;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  background: #e6e6e6;
  width: 100%;
  border-bottom: 1px solid #ccc;
}
</style>
