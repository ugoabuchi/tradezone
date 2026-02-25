export const useAppDispatch = () => {
  const { useDispatch } = require('react-redux');
  return useDispatch();
};

export const useAppSelector = (selector: (state: any) => any) => {
  const { useSelector } = require('react-redux');
  return useSelector(selector);
};
