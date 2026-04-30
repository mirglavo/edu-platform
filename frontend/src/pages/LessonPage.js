import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Button, Form, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonRes, assignmentsRes, filesRes] = await Promise.all([
          api.get(`lessons/${id}/`),
          api.get(`lessons/${id}/assignments/`),
          api.get(`files/?lesson=${id}`)
        ]);

        setLesson(lessonRes.data);
        setAssignments(assignmentsRes.data);
        setFiles(filesRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAnswerChange = (assignmentId, value) => {
    setAnswers({
      ...answers,
      [assignmentId]: value
    });
  };

  const handleFileChange = (assignmentId, filesList) => {
    setSelectedFiles({
      ...selectedFiles,
      [assignmentId]: filesList
    });
  };

  const handleSubmit = async (assignmentId) => {
    setSubmitting({ ...submitting, [assignmentId]: true });

    try {
      const formData = new FormData();
      formData.append('assignment_id', assignmentId);
      formData.append('answer', answers[assignmentId] || '');

      if (selectedFiles[assignmentId] && selectedFiles[assignmentId].length > 0) {
        for (let i = 0; i < selectedFiles[assignmentId].length; i++) {
          formData.append('files', selectedFiles[assignmentId][i]);
        }
      }

      const response = await api.post('submit-answer/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResults({
        ...results,
        [assignmentId]: response.data
      });

      setSelectedFiles({
        ...selectedFiles,
        [assignmentId]: []
      });

      alert(response.data.correct ? 'Правильно! Молодец!' : 'Ответ отправлен на проверку учителю.');
    } catch (error) {
      console.error('Ошибка при отправке:', error);
      alert('Ошибка при отправке ответа');
    } finally {
      setSubmitting({ ...submitting, [assignmentId]: false });
    }
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf': return '📄 PDF';
      case 'image': return '🖼️ Изображение';
      case 'video': return '🎥 Видео';
      default: return '📎 Файл';
    }
  };

  const getDownloadUrl = (file) => {
    const filePath = file.file_url || file.file;

    if (filePath && filePath.startsWith('http')) {
      return filePath;
    }
    if (filePath && filePath.startsWith('/media/')) {
      return `http://127.0.0.1:8000${filePath}`;
    }
    return `http://127.0.0.1:8000/media/${filePath}`;
  };

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (!lesson) return (
    <Container className="text-center mt-5">
      <h3>Урок не найден</h3>
      <Button as={Link} to="/" variant="primary" className="mt-3">
        На главную
      </Button>
    </Container>
  );

  return (
    <Container className="py-5">
      <Button
        as={Link}
        to={`/course/${lesson.course}`}
        variant="outline-primary"
        className="mb-4"
      >
        ← Назад к курсу
      </Button>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title as="h1" className="text-primary mb-4" style={{ fontSize: '2.5rem' }}>
            {lesson.title}
          </Card.Title>

          {/* Теория урока с поддержкой Markdown */}
          <div
            className="lesson-content markdown-body"
            style={{
              fontSize: '1.2rem',
              lineHeight: '1.8',
              color: '#000000',
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Кастомные стили для элементов Markdown
                h1: ({node, ...props}) => <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '1rem', color: '#000' }} {...props} />,
                h2: ({node, ...props}) => <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '1.3rem', marginBottom: '0.8rem', color: '#000' }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1.2rem', marginBottom: '0.6rem', color: '#000' }} {...props} />,
                h4: ({node, ...props}) => <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem', color: '#000' }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: '1rem', color: '#000' }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold', color: '#000' }} {...props} />,
                em: ({node, ...props}) => <em style={{ fontStyle: 'italic', color: '#000' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: '0.3rem', color: '#000' }} {...props} />,
                a: ({node, ...props}) => <a style={{ color: '#0066cc', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer" {...props} />,
                code: ({node, inline, ...props}) =>
                  inline
                    ? <code style={{ backgroundColor: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: '#d63384' }} {...props} />
                    : <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '1rem' }}><code {...props} /></pre>,
                blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid #007bff', paddingLeft: '1rem', margin: '1rem 0', color: '#555' }} {...props} />,
                table: ({node, ...props}) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }} {...props} />,
                th: ({node, ...props}) => <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }} {...props} />,
                td: ({node, ...props}) => <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />,
              }}
            >
              {lesson.content}
            </ReactMarkdown>
          </div>
        </Card.Body>
      </Card>

      {/* Файлы к уроку */}
      {files.length > 0 && (
        <>
          <h3 className="mt-4 mb-3" style={{ fontSize: '1.8rem', color: '#000000' }}>📁 Материалы к уроку</h3>
          <ListGroup className="mb-4">
            {files.map(file => {
              const downloadUrl = getDownloadUrl(file);
              return (
                <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                      {getFileIcon(file.file_type)}
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: '#000000' }}>{file.title}</strong>
                    {file.lesson && (
                      <Badge bg="info" className="ms-2">к уроку</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    as="a"
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Скачать
                  </Button>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </>
      )}

      <h2 className="mb-4" style={{ fontSize: '2rem', color: '#000000' }}>Задания к уроку:</h2>
      {assignments.length === 0 ? (
        <Alert variant="info">
          К этому уроку пока нет заданий
        </Alert>
      ) : (
        assignments.map(assignment => (
          <Card key={assignment.id} className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="h5 mb-3" style={{ fontSize: '1.2rem', color: '#000000' }}>
                <span className="badge bg-primary me-2">Задание</span>
                {assignment.question}
              </Card.Title>

              {assignment.attachment && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#000000' }}>📎 Вложение к заданию: {assignment.attachment.split('/').pop()}</span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      as="a"
                      href={getDownloadUrl({ file: assignment.attachment })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Скачать
                    </Button>
                  </div>
                </Alert>
              )}

              {results[assignment.id] && (
                <Alert variant={results[assignment.id].correct ? "success" : "info"}>
                  {results[assignment.id].correct
                    ? "✓ Правильно! Балл: " + results[assignment.id].score
                    : "✗ Ответ отправлен. Учитель проверит и выставит оценку."}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '1.1rem', color: '#000000' }}>Ваш ответ:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={answers[assignment.id] || ''}
                  onChange={(e) => handleAnswerChange(assignment.id, e.target.value)}
                  placeholder="Введите ваш ответ..."
                  disabled={submitting[assignment.id]}
                  style={{ fontSize: '1rem' }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '1.1rem', color: '#000000' }}>Прикрепить файлы (необязательно)</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(assignment.id, Array.from(e.target.files))}
                  disabled={submitting[assignment.id]}
                />
                <Form.Text className="text-muted">
                  Можно прикрепить несколько файлов (изображения, документы)
                </Form.Text>
                {selectedFiles[assignment.id] && selectedFiles[assignment.id].length > 0 && (
                  <div className="mt-2">
                    <small className="text-success">
                      Выбрано файлов: {selectedFiles[assignment.id].length}
                    </small>
                  </div>
                )}
              </Form.Group>

              <Button
                variant="success"
                onClick={() => handleSubmit(assignment.id)}
                disabled={submitting[assignment.id]}
                style={{ fontSize: '1rem', padding: '10px 20px' }}
              >
                {submitting[assignment.id] ? 'Отправка...' : 'Отправить ответ'}
              </Button>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
}

export default LessonPage;