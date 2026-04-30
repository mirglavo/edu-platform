import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Пытаемся войти с:', username);

      // 1. Получаем токен
      const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
        username: username,
        password: password
      });

      console.log('Токен получен:', response.data.token);

      // Сохраняем токен
      localStorage.setItem('token', response.data.token);

      // 2. Получаем данные пользователя (список всех пользователей)
      const usersResponse = await axios.get('http://127.0.0.1:8000/api/users/', {
        headers: { 'Authorization': `Token ${response.data.token}` }
      });

      // Находим текущего пользователя
      const currentUser = usersResponse.data.find(u => u.username === username);

      console.log('Найден пользователь:', currentUser);
      console.log('is_staff:', currentUser?.is_staff);

      if (currentUser) {
        // Сохраняем пользователя в localStorage
        const userData = {
          id: currentUser.id,
          username: currentUser.username,
          is_staff: currentUser.is_staff
        };

        localStorage.setItem('user', JSON.stringify(userData));

        // Передаем в состояние App
        setUser(userData);

        // Перенаправляем на главную
        navigate('/');
      } else {
        setError('Пользователь не найден');
      }

    } catch (err) {
      console.error('Ошибка входа:', err);

      if (err.response?.status === 400) {
        setError('Неверное имя пользователя или пароль');
      } else if (err.response?.status === 401) {
        setError('Неверные учетные данные');
      } else if (err.message === 'Network Error') {
        setError('Сервер не отвечает. Убедитесь, что Django запущен (python manage.py runserver)');
      } else {
        setError('Ошибка при входе. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '500px' }}>
      <Card className="shadow">
        <Card.Body className="p-5">
          <h2 className="text-center mb-4">Вход в систему</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Имя пользователя</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Введите логин"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите пароль"
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
            
            <p className="text-center mb-0">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;