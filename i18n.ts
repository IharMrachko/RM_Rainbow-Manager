import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot',
    userName: 'Username',
    incorrectLoginPassword: 'Incorrect login or password',
    userNotFound: 'User not found',
    validation: {
      required: 'This field is required',
      email: 'Invalid email address',
      min: 'Minimum {count} characters',
    },
    colorType: 'Color type',
    gallery: 'Gallery',
    upload: 'Upload',
    mask: 'Mask',
    collage: 'Collage',
    logout: 'Logout',
    saveToGallery: 'Save to Gallery',
    addSign: 'Add Sign',
    shareImageWithCollage: 'Share image with collage',
    shareImageWithMask: 'Share image with mask',
    rememberChoose: 'Remember choose',
    successImage: 'Image uploaded',
    errorImage: 'Error image uploaded',
  },
  ru: {
    login: 'Вход',
    email: 'Почта',
    password: 'Пароль',
    forgot: 'Забыли',
    userName: 'Имя пользователя',
    incorrectLoginPassword: 'Неверный логин или пароль',
    userNotFound: 'Пользователь не найден',
    validation: {
      required: 'Поле обязательно',
      email: 'Некорректный email',
      min: 'Минимум {count} символов',
    },
    colorType: 'Колористика',
    gallery: 'Галерея',
    upload: 'Загрузить',
    mask: 'Маска',
    collage: 'Коллаж',
    logout: 'Выйти',
    saveToGallery: 'Сохранить в галерею',
    addSign: 'Добавить подпись',
    shareImageWithCollage: 'Показывать в коллаже',
    shareImageWithMask: 'Показывать в маске',
    rememberChoose: 'Запомнить',
    successImage: 'Изображение загружено',
    errorImage: 'Ошибка при загрузке изображения',
  },
};

export const i18n = createI18n({
  locale: 'en', // язык по умолчанию
  fallbackLocale: 'ru', // запасной язык
  messages,
});
