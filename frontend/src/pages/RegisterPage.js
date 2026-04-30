import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users/', {
        username: formData.username,
        email: formData.email || `${formData.username}@example.com`,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      console.log('Регистрация успешна:', response.data);
      alert('Регистрация прошла успешно! Теперь вы можете войти.');
      navigate('/login');

    } catch (err) {
      console.error('Ошибка регистрации:', err);
      console.error('Ответ сервера:', err.response?.data);

      if (err.response?.data) {
        const serverError = err.response.data;
        let errorMessage = '';

        if (serverError.username) {
          errorMessage += `Имя пользователя: ${serverError.username.join(' ')}`;
        } else if (serverError.password) {
          errorMessage += `Пароль: ${serverError.password.join(' ')}`;
        } else if (serverError.email) {
          errorMessage += `Email: ${serverError.email.join(' ')}`;
        } else {
          errorMessage = 'Ошибка при регистрации';
        }

        setError(errorMessage);
      } else {
        setError('Ошибка соединения с сервером. Убедитесь, что Django запущен.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '500px' }}>
      <Card className="shadow">
        <Card.Body className="p-5">
          <h2 className="text-center mb-4">Регистрация</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Имя пользователя *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Придумайте логин"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Имя и отчество*</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Ваше имя и отчество"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Фамилия*</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Ваша фамилия"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Пароль *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Минимум 8 символов"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Подтвердите пароль *</Form.Label>
              <Form.Control
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
                placeholder="Введите пароль еще раз"
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            <p className="text-center mb-0">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RegisterPage;