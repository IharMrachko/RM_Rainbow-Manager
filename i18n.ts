import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot',
    userName: 'Username',
  },
  ru: {
    login: 'Вход',
    email: 'Почта',
    password: 'Пароль',
    forgot: 'Забыли',
    userName: 'Имя пользователя',
  },
};

export const i18n = createI18n({
  locale: 'en', // язык по умолчанию
  fallbackLocale: 'ru', // запасной язык
  messages,
});
