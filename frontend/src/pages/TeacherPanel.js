import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Form, Modal, Row, Col, Spinner, Alert, ListGroup, ProgressBar } from 'react-bootstrap';
import api from '../services/api';

function TeacherPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [stats, setStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [newScore, setNewScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    loadClasses();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [selectedStudent, selectedCourse, selectedClass, submissions]);

  const fetchData = async () => {
    try {
      const [submissionsRes, statsRes, studentsRes, coursesRes] = await Promise.all([
        api.get('teacher/all_submissions/'),
        api.get('teacher/course_stats/'),
        api.get('users/students/'),
        api.get('teacher/my_courses/')
      ]);
      setSubmissions(submissionsRes.data);
      setFilteredSubmissions(submissionsRes.data);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить данные');
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await api.get('classes/');
      setClasses(response.data);
    } catch (err) {
      console.error('Ошибка загрузки классов:', err);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (selectedClass !== '') {
      // Сначала фильтруем курсы по классу
      const coursesInClass = courses.filter(c => c.class_group === parseInt(selectedClass)).map(c => c.id);
      filtered = filtered.filter(sub => coursesInClass.includes(sub.course_id));
    }

    if (selectedCourse !== '') {
      filtered = filtered.filter(sub => sub.course_id === parseInt(selectedCourse));
    }

    if (selectedStudent !== '') {
      filtered = filtered.filter(sub => sub.student_id === parseInt(selectedStudent));
    }

    setFilteredSubmissions(filtered);
  };

  const handleOpenModal = (grade) => {
    setSelectedGrade(grade);
    setNewScore(grade.score || '');
    setFeedback(grade.feedback || '');
    setShowModal(true);
  };

  const handleUpdateGrade = async () => {
    try {
      await api.post('teacher/update_grade/', {
        grade_id: selectedGrade.id,
        score: parseInt(newScore),
        feedback: feedback
      });

      fetchData();
      setShowModal(false);
      alert('Оценка обновлена!');
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка при обновлении оценки');
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    if (filePath.startsWith('/media/')) return `http://127.0.0.1:8000${filePath}`;
    return `http://127.0.0.1:8000/media/${filePath}`;
  };

  const getScoreBadge = (score) => {
    if (!score && score !== 0) return <Badge bg="secondary">Не оценено</Badge>;
    if (score >= 85) return <Badge bg="success">{score}</Badge>;
    if (score >= 70) return <Badge bg="info">{score}</Badge>;
    if (score >= 50) return <Badge bg="warning">{score}</Badge>;
    return <Badge bg="danger">{score}</Badge>;
  };

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Загрузка панели учителя...</p>
    </Container>
  );

  if (error) return (
    <Container className="mt-5">
      <Alert variant="danger">{error}</Alert>
    </Container>
  );

  return (
    <Container className="py-5">
      <h1 className="mb-4">👨‍🏫 Панель учителя</h1>

      <h2 className="mb-3">📊 Статистика по вашим курсам</h2>
      <Row className="mb-5">
        {stats.length === 0 ? (
          <Col>
            <Alert variant="info">У вас пока нет курсов. Создайте их в конструкторе.</Alert>
          </Col>
        ) : (
          stats.map(course => (
            <Col md={4} key={course.course_id} className="mb-3">
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>{course.course_title}</Card.Title>
                  <p className="mb-1">
                    <strong>Заданий всего:</strong> {course.total_assignments}
                  </p>
                  <p className="mb-1">
                    <strong>Выполнено:</strong> {course.completed_assignments}
                  </p>
                  <p>
                    <strong>Выполнено %:</strong>
                    {course.total_assignments > 0
                      ? Math.round(course.completed_assignments / course.total_assignments * 100)
                      : 0}%
                  </p>
                  <ProgressBar
                    now={course.total_assignments > 0
                      ? Math.round(course.completed_assignments / course.total_assignments * 100)
                      : 0}
                    variant="primary"
                  />
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <h2 className="mb-3">📝 Ответы учеников</h2>

      {/* Фильтры */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
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
            <Col md={4}>
              <Form.Group>
                <Form.Label>Фильтр по курсу</Form.Label>
                <Form.Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">-- Все курсы --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Фильтр по ученику</Form.Label>
                <Form.Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">-- Все ученики --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSelectedClass('');
                  setSelectedCourse('');
                  setSelectedStudent('');
                }}
              >
                Сбросить все фильтры
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          {filteredSubmissions.length === 0 ? (
            <Alert variant="info">
              {selectedClass || selectedCourse || selectedStudent
                ? "Нет ответов по выбранным фильтрам"
                : "У вас пока нет ответов от учеников"}
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Курс</th>
                  <th>Урок</th>
                  <th>Задание</th>
                  <th>Ответ</th>
                  <th>Файлы</th>
                  <th>Оценка</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id}>
                    <td>{sub.student_name}</td>
                    <td>{sub.course_name}</td>
                    <td>{sub.lesson_name}</td>
                    <td style={{ maxWidth: '200px' }}>{sub.question?.substring(0, 60)}...</td>
                    <td style={{ maxWidth: '200px' }}>{sub.answer?.substring(0, 60) || '-'}</td>
                    <td>
                      {sub.attachments && sub.attachments.length > 0 ? (
                        <Badge bg="info" style={{ cursor: 'pointer' }} onClick={() => handleOpenModal(sub)}>
                          📎 {sub.attachments.length} файл(ов)
                        </Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{getScoreBadge(sub.score)}</td>
                    <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenModal(sub)}
                      >
                        Оценить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Модальное окно для оценки */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Оценка работы</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGrade && (
            <>
              <Row>
                <Col md={6}>
                  <p><strong>Ученик:</strong> {selectedGrade.student_name}</p>
                  <p><strong>Курс:</strong> {selectedGrade.course_name}</p>
                  <p><strong>Урок:</strong> {selectedGrade.lesson_name}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Дата сдачи:</strong> {new Date(selectedGrade.submitted_at).toLocaleString()}</p>
                  <p><strong>Текущая оценка:</strong> {getScoreBadge(selectedGrade.score)}</p>
                </Col>
              </Row>

              <hr />

              <p><strong>Задание:</strong></p>
              <Card className="bg-light mb-3 p-3">
                <p className="mb-0">{selectedGrade.question}</p>
              </Card>

              <p><strong>Ответ ученика:</strong></p>
              <Card className="bg-light mb-3 p-3">
                <p className="mb-0">{selectedGrade.answer || '(ответ не введен)'}</p>
              </Card>

              {selectedGrade.attachments && selectedGrade.attachments.length > 0 && (
                <>
                  <p><strong>📎 Прикрепленные файлы:</strong></p>
                  <ListGroup className="mb-3">
                    {selectedGrade.attachments.map(att => (
                      <ListGroup.Item key={att.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>📄</span>
                          <strong>{att.title}</strong>
                          <small className="text-muted ms-2">
                            {new Date(att.uploaded_at).toLocaleString()}
                          </small>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as="a"
                          href={getFileUrl(att.file_url || att.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Скачать
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}

              <hr />

              <Form.Group className="mb-3">
                <Form.Label>Оценка (0-100)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="100"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="Введите балл от 0 до 100"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Комментарий учителя</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Напишите комментарий к работе..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpdateGrade}>
            Сохранить оценку
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TeacherPanel;