// store/modules/gallery.ts
import { db, storage } from '@/firebase';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { Module } from 'vuex';
import { ColoristicType } from '@/types/coloristic.type';
import { MaskType } from '@/types/mask.type';

interface SaveOptions {
  canvas: HTMLCanvasElement;
  path?: string;
  title?: string;
  coloristicType?: ColoristicType;
  maskType?: MaskType;
  folder?: string;
  userId: string;
}

export const gallery: Module<any, any> = {
  namespaced: true,
  actions: {
    async saveImageToGallery(
      { dispatch },
      {
        canvas,
        path = `avatar/${Date.now()}.png`,
        title = '',
        coloristicType,
        maskType,
        userId,
        folder = '',
      }: SaveOptions
    ) {
      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Не удалось получить Blob из canvas'));

          try {
            // 1. Сохраняем в Storage
            const fileRef = storageRef(storage, path);
            await uploadBytes(fileRef, blob);
            const downloadURL = await getDownloadURL(fileRef);

            // 2. Добавляем запись в Firestore
            await addDoc(collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items'), {
              userId,
              url: downloadURL,
              title,
              coloristicType,
              maskType,
              folder,
              createdAt: new Date(),
            });

            await dispatch(
              'toast/addToast',
              { message: 'successImage', severity: 'success' },
              { root: true }
            );
            resolve(downloadURL);
          } catch (err) {
            await dispatch(
              'toast/addToast',
              { message: 'errorImage', severity: 'error' },
              { root: true }
            );
            reject(err);
          }
        }, 'image/png');
      });
    },
  },
};
