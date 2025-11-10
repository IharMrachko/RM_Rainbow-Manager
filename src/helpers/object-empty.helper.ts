export const isObjectEmpty = (item: object) => Object.keys(item).length === 0;
export const filterObjectForEmpty = (item: object) => {
  return Object.fromEntries(Object.entries(item).filter(([, v]) => v));
};
