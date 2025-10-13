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
  },
  ru: {
    login: 'Вход',
    email: 'Почта',
    password: 'Пароль',
    forgot: 'Забыли',
    userName: 'Имя пользователя',
    incorrectLoginPassword: 'Неверный логин или пароль',
    userNotFound: 'Пользователь не найден',
  },
};

export const i18n = createI18n({
  locale: 'en', // язык по умолчанию
  fallbackLocale: 'ru', // запасной язык
  messages,
});
