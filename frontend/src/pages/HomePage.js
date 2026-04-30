import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Badge, Form, Button } from 'react-bootstrap';
import api from '../services/api';

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await api.get('classes/');
      setClasses(response.data);
    } catch (err) {
      console.error('Ошибка загрузки классов:', err);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      let url = 'courses/';
      if (selectedClass) {
        url += `?class=${selectedClass}`;
      }
      const response = await api.get(url);
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
      setLoading(false);
    }
  };

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Загрузка курсов...</p>
    </Container>
  );

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Образовательная платформа</h1>
      <p className="text-center text-muted mb-5">Лицей ТГУ</p>

      {/* Фильтр по классу */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Фильтр по классу</Form.Label>
                <Form.Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Все классы --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade} класс)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => setSelectedClass('')}
                className="w-100"
              >
                Сбросить фильтр
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h2 className="mb-4">Доступные курсы:</h2>
      <Row>
        {courses.length === 0 ? (
          <Col>
            <Card className="text-center p-5">
              <Card.Text>Пока нет курсов для выбранного класса</Card.Text>
            </Card>
          </Col>
        ) : (
          courses.map(course => (
            <Col md={6} lg={4} key={course.id} className="mb-4">
              <Link to={`/course/${course.id}`} style={{ textDecoration: 'none' }}>
                <Card className="h-100 shadow-sm hover-effect">
                  <Card.Body>
                    <Card.Title className="text-primary h4">{course.title}</Card.Title>
                    <Card.Text className="text-dark">
                      {course.description}
                    </Card.Text>
                    {course.class_name && (
                      <Badge bg="secondary" className="mt-2">
                        📚 {course.class_name}
                      </Badge>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white border-0">
                    <small className="text-muted">Преподаватель: {course.teacher_name}</small>
                  </Card.Footer>
                </Card>
              </Link>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
}

export default HomePage;