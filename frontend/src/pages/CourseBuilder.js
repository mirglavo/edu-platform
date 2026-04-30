import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Modal, Alert, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import api from '../services/api';

function CourseBuilder() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [selectedCourseFiles, setSelectedCourseFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_group: '',
    lesson_title: '',
    lesson_content: '',
    question: '',
    question_type: 'test',
    correct_answer: ''
  });
  const [fileData, setFileData] = useState({
    title: '',
    file_type: 'other',
    file: null,
    lesson_id: ''
  });

  useEffect(() => {
    loadCourses();
    loadClasses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('courses/');
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка:', err);
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

  const loadCourseLessons = async (courseId) => {
    try {
      const response = await api.get(`courses/${courseId}/lessons/`);
      setCourseLessons(response.data);
      return response.data;
    } catch (err) {
      console.error('Ошибка загрузки уроков:', err);
      return [];
    }
  };

  const loadCourseFiles = async (courseId) => {
    try {
      const response = await api.get(`files/?course=${courseId}`);
      setSelectedCourseFiles(response.data);
    } catch (err) {
      console.error('Ошибка загрузки файлов:', err);
    }
  };

  const viewCourseLessons = async (course) => {
    try {
      const lessons = await loadCourseLessons(course.id);
      setCourseLessons(lessons);
      setSelectedCourse(course);
      setShowLessonsModal(true);
    } catch (err) {
      console.error('Ошибка:', err);
      setMessage({ type: 'danger', text: 'Ошибка загрузки уроков' });
    }
  };

  const handleCreateCourse = async () => {
    try {
      await api.post('courses/create_course/', {
        title: formData.title,
        description: formData.description,
        class_group: formData.class_group || null
      });
      setMessage({ type: 'success', text: 'Курс создан!' });
      setShowCourseModal(false);
      setFormData({ ...formData, title: '', description: '', class_group: '' });
      loadCourses();
    } catch (err) {
      console.error('Ошибка:', err.response?.data);
      setMessage({ type: 'danger', text: 'Ошибка при создании курса' });
    }
  };

  const handleAddLesson = async () => {
    try {
      await api.post(`courses/${selectedCourse.id}/add_lesson/`, {
        title: formData.lesson_title,
        content: formData.lesson_content,
        order: 0
      });
      setMessage({ type: 'success', text: 'Урок добавлен!' });
      setShowLessonModal(false);
      setFormData({ ...formData, lesson_title: '', lesson_content: '' });
      loadCourses();
    } catch (err) {
      console.error('Ошибка:', err);
      setMessage({ type: 'danger', text: 'Ошибка при добавлении урока' });
    }
  };

  const handleAddAssignment = async () => {
    try {
      await api.post(`courses/${selectedCourse.id}/add_assignment/`, {
        lesson_id: selectedLesson.id,
        question: formData.question,
        question_type: formData.question_type,
        correct_answer: formData.correct_answer
      });
      setMessage({ type: 'success', text: 'Задание добавлено!' });
      setShowAssignmentModal(false);
      setFormData({ ...formData, question: '', correct_answer: '' });
    } catch (err) {
      console.error('Ошибка:', err);
      setMessage({ type: 'danger', text: 'Ошибка при добавлении задания' });
    }
  };

  const handleUploadFile = async () => {
    if (!fileData.file) {
      setMessage({ type: 'danger', text: 'Выберите файл для загрузки' });
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('course', selectedCourse.id);
    uploadFormData.append('title', fileData.title || fileData.file.name);
    uploadFormData.append('file_type', fileData.file_type);
    uploadFormData.append('file', fileData.file);

    if (fileData.lesson_id) {
      uploadFormData.append('lesson', fileData.lesson_id);
    }

    try {
      await api.post('files/', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Файл загружен!' });
      setShowFileModal(false);
      setFileData({ title: '', file_type: 'other', file: null, lesson_id: '' });
      loadCourseFiles(selectedCourse.id);
    } catch (err) {
      console.error('Ошибка:', err);
      setMessage({ type: 'danger', text: 'Ошибка при загрузке файла' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Удалить файл?')) {
      try {
        await api.delete(`files/${fileId}/`);
        setMessage({ type: 'success', text: 'Файл удален' });
        loadCourseFiles(selectedCourse.id);
      } catch (err) {
        setMessage({ type: 'danger', text: 'Ошибка при удалении' });
      }
    }
  };

  const openFileModal = async (course) => {
    setSelectedCourse(course);
    const lessons = await loadCourseLessons(course.id);
    setCourseLessons(lessons);
    await loadCourseFiles(course.id);
    setShowFileModal(true);
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📎';
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    if (filePath.startsWith('/media/')) return `http://127.0.0.1:8000${filePath}`;
    return `http://127.0.0.1:8000/media/${filePath}`;
  };

  if (loading) return <Container className="mt-5 text-center">Загрузка...</Container>;

  return (
    <Container className="py-5">
      <h1 className="mb-4">📚 Конструктор курсов</h1>

      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <div className="mb-4">
        <Button variant="primary" onClick={() => setShowCourseModal(true)} className="me-2">
          + Создать новый курс
        </Button>
      </div>

      <Row>
        {courses.map(course => (
          <Col md={6} lg={4} key={course.id} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>{course.title}</Card.Title>
                <Card.Text className="text-muted">{course.description}</Card.Text>
                <Badge bg="info" className="mb-2">ID: {course.id}</Badge>
                {course.class_name && (
                  <Badge bg="secondary" className="mb-2 ms-2">📚 {course.class_name}</Badge>
                )}
                <div className="mt-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 mb-2"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowLessonModal(true);
                    }}
                  >
                    + Урок
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2 mb-2"
                    onClick={() => openFileModal(course)}
                  >
                    📁 Файлы
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="mb-2"
                    onClick={() => viewCourseLessons(course)}
                  >
                    📖 Просмотр уроков
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Модальное окно создания курса */}
      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Создать курс</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Название курса</Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Класс</Form.Label>
            <Form.Select
              value={formData.class_group}
              onChange={(e) => setFormData({ ...formData, class_group: e.target.value })}
            >
              <option value="">-- Выберите класс --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade} класс)
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleCreateCourse}>Создать</Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно добавления урока */}
      <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Добавить урок в {selectedCourse?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Название урока</Form.Label>
            <Form.Control
              type="text"
              value={formData.lesson_title}
              onChange={(e) => setFormData({ ...formData, lesson_title: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Содержание урока (поддерживается Markdown)</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={formData.lesson_content}
              onChange={(e) => setFormData({ ...formData, lesson_content: e.target.value })}
            />
            <Form.Text className="text-muted">
              Можно использовать Markdown: # Заголовок, **жирный**, *курсив*, - список и т.д.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLessonModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleAddLesson}>Добавить урок</Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно добавления задания */}
      <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить задание к уроку: {selectedLesson?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Вопрос</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Тип вопроса</Form.Label>
            <Form.Select
              value={formData.question_type}
              onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
            >
              <option value="test">Тест (сравнение с ответом)</option>
              <option value="open">Открытый вопрос</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Правильный ответ</Form.Label>
            <Form.Control
              type="text"
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              placeholder="Для теста: правильный ответ"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleAddAssignment}>Добавить задание</Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно управления файлами */}
      <Modal show={showFileModal} onHide={() => setShowFileModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Файлы курса: {selectedCourse?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Загрузить новый файл</h5>
          <Form.Group className="mb-3">
            <Form.Label>Название файла (опционально)</Form.Label>
            <Form.Control
              type="text"
              value={fileData.title}
              onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
              placeholder="Оставьте пустым для использования имени файла"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Привязать к уроку (опционально)</Form.Label>
            <Form.Select
              value={fileData.lesson_id}
              onChange={(e) => setFileData({ ...fileData, lesson_id: e.target.value })}
            >
              <option value="">-- Весь курс (без привязки к уроку) --</option>
              {courseLessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Если выберете урок, файл будет отображаться только на его странице
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Тип файла</Form.Label>
            <Form.Select
              value={fileData.file_type}
              onChange={(e) => setFileData({ ...fileData, file_type: e.target.value })}
            >
              <option value="other">Другое</option>
              <option value="pdf">PDF документ</option>
              <option value="image">Изображение</option>
              <option value="video">Видео</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Выберите файл</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setFileData({ ...fileData, file: e.target.files[0] })}
            />
          </Form.Group>
          <Button
            variant="primary"
            onClick={handleUploadFile}
            disabled={uploading}
            className="mb-4"
          >
            {uploading ? 'Загрузка...' : 'Загрузить файл'}
          </Button>

          <hr />

          <h5>Загруженные файлы</h5>
          {selectedCourseFiles.length === 0 ? (
            <p className="text-muted">Нет загруженных файлов</p>
          ) : (
            <ListGroup>
              {selectedCourseFiles.map(file => (
                <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                      {getFileIcon(file.file_type)}
                    </span>
                    <strong>{file.title}</strong>
                    {file.lesson && (
                      <Badge bg="info" className="ms-2">Урок: {file.lesson}</Badge>
                    )}
                    <small className="text-muted ms-2">({file.file_type})</small>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      as="a"
                      href={getFileUrl(file.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Скачать
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFileModal(false)}>Закрыть</Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно просмотра уроков */}
      <Modal show={showLessonsModal} onHide={() => setShowLessonsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Уроки курса: {selectedCourse?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {courseLessons.length === 0 ? (
            <p className="text-muted">В этом курсе пока нет уроков</p>
          ) : (
            <ListGroup>
              {courseLessons.map((lesson, index) => (
                <ListGroup.Item key={lesson.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <Badge bg="primary" className="me-2">Урок {index + 1}</Badge>
                      <strong>{lesson.title}</strong>
                      <p className="text-muted mt-2 mb-0 small">
                        {lesson.content ? lesson.content.substring(0, 100) : 'Нет содержания'}...
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowAssignmentModal(true);
                          setShowLessonsModal(false);
                        }}
                      >
                        + Задание
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLessonsModal(false)}>Закрыть</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CourseBuilder;