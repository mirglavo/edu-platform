import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import api from '../services/api';

function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`courses/${id}/`),
      api.get(`courses/${id}/lessons/`)
    ])
      .then(([courseRes, lessonsRes]) => {
        setCourse(courseRes.data);
        setLessons(lessonsRes.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Ошибка загрузки:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (!course) return (
    <Container className="text-center mt-5">
      <h3>Курс не найден</h3>
      <Button as={Link} to="/" variant="primary" className="mt-3">
        Вернуться на главную
      </Button>
    </Container>
  );

  return (
    <Container className="py-5">
      <Button as={Link} to="/" variant="outline-primary" className="mb-4">
        ← Назад к курсам
      </Button>

      <Card className="shadow-sm mb-5">
        <Card.Body>
          <Card.Title as="h1" className="text-primary mb-3">{course.title}</Card.Title>
          <Card.Text className="lead">{course.description}</Card.Text>
          <Card.Text>
            <small className="text-muted">Преподаватель: {course.teacher_name}</small>
          </Card.Text>
        </Card.Body>
      </Card>

      <h2 className="mb-4">Уроки курса:</h2>
      {lessons.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Text>В этом курсе пока нет уроков</Card.Text>
        </Card>
      ) : (
        <Row>
          {lessons.map((lesson, index) => (
            <Col md={6} key={lesson.id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-primary rounded-pill">Урок {index + 1}</span>
                  </div>
                  <Card.Title>{lesson.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {lesson.content.substring(0, 100)}...
                  </Card.Text>
                  <Button
                    as={Link}
                    to={`/lesson/${lesson.id}`}
                    variant="outline-primary"
                    className="mt-2"
                  >
                    Перейти к уроку →
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default CoursePage;