import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  return null;
};
