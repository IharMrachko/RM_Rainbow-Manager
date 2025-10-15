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
  },
};

export const i18n = createI18n({
  locale: 'en', // язык по умолчанию
  fallbackLocale: 'ru', // запасной язык
  messages,
});
