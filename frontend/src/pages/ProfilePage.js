import React, { useState, useEffect } from 'react';
import { Container, Card, Table, ProgressBar, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';

function ProfilePage() {
  const [grades, setGrades] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, progressRes, userRes] = await Promise.all([
          api.get('grades/my_grades/'),
          api.get('statistics/my_progress/'),
          api.get('users/me/')
        ]);

        setGrades(gradesRes.data);
        setProgress(progressRes.data);
        setUserInfo(userRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setError('Не удалось загрузить данные');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Загрузка профиля...</p>
    </Container>
  );

  if (error) return (
    <Container className="mt-5">
      <Alert variant="danger">{error}</Alert>
    </Container>
  );

  return (
    <Container className="py-5">
      <h1 className="mb-4">Мой профиль</h1>

      {userInfo && (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <h3>{userInfo.full_name || userInfo.username}</h3>
            <p className="text-muted mb-0">Логин: {userInfo.username}</p>
            {userInfo.email && <p className="text-muted">Email: {userInfo.email}</p>}
          </Card.Body>
        </Card>
      )}

      <h2 className="mb-3">Прогресс по курсам</h2>
      <Row className="mb-5">
        {progress.length === 0 ? (
          <Col>
            <Alert variant="info">Нет данных о прогрессе</Alert>
          </Col>
        ) : (
          progress.map(course => (
            <Col md={6} lg={4} key={course.course_id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>{course.course_title}</Card.Title>
                  <div className="text-center my-3">
                    <h3 className="text-primary">{course.progress_percent}%</h3>
                    <small className="text-muted">
                      {course.completed_lessons} / {course.total_lessons} уроков
                    </small>
                  </div>
                  <ProgressBar
                    now={course.progress_percent}
                    variant="primary"
                    className="mt-2"
                  />
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <h2 className="mb-3">Мои оценки</h2>
      {grades.length === 0 ? (
        <Alert variant="info">У вас пока нет выполненных заданий</Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Курс</th>
                  <th>Урок</th>
                  <th>Задание</th>
                  <th>Балл</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id}>
                    <td>{grade.course_name}</td>
                    <td>{grade.lesson_name}</td>
                    <td>{grade.question.substring(0, 50)}...</td>
                    <td>
                      <span className={`fw-bold ${grade.score >= 70 ? 'text-success' : grade.score >= 50 ? 'text-warning' : 'text-danger'}`}>
                        {grade.score !== null ? grade.score : 'не оценено'}
                      </span>
                    </td>
                    <td>{new Date(grade.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default ProfilePage;