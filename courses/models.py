from django.db import models
from django.contrib.auth.models import User


class Class(models.Model):
    """Модель класса/группы"""
    name = models.CharField(max_length=50, verbose_name="Название класса")
    grade = models.IntegerField(verbose_name="Номер класса", choices=[(i, f"{i} класс") for i in range(1, 12)])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.grade} класс)"

    class Meta:
        verbose_name = "Класс"
        verbose_name_plural = "Классы"
        ordering = ['grade', 'name']


class Course(models.Model):
    """Модель курса"""
    title = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(verbose_name="Описание")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_courses',
                                verbose_name="Преподаватель")
    class_group = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses',
                                    verbose_name="Класс")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Курс"
        verbose_name_plural = "Курсы"


class Lesson(models.Model):
    """Модель урока"""
    title = models.CharField(max_length=200, verbose_name="Название")
    content = models.TextField(verbose_name="Содержание урока")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons', verbose_name="Курс")
    order = models.PositiveIntegerField(verbose_name="Порядковый номер", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    class Meta:
        verbose_name = "Урок"
        verbose_name_plural = "Уроки"
        ordering = ['order']


class Assignment(models.Model):
    QUESTION_TYPES = [
        ('test', 'Тест (выбор ответа)'),
        ('open', 'Открытый вопрос'),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='assignments', verbose_name="Урок")
    question = models.TextField(verbose_name="Вопрос")
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='test', verbose_name="Тип вопроса")
    correct_answer = models.TextField(verbose_name="Правильный ответ", blank=True)
    attachment = models.FileField(upload_to='assignment_attachments/', blank=True, null=True,
                                  verbose_name="Вложение к заданию")

    def __str__(self):
        return f"Задание к {self.lesson.title}"

    class Meta:
        verbose_name = "Задание"
        verbose_name_plural = "Задания"


class Grade(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades', verbose_name="Ученик")
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='grades', verbose_name="Задание")
    score = models.PositiveIntegerField(verbose_name="Балл", null=True, blank=True)
    feedback = models.TextField(verbose_name="Ответ ученика", blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата сдачи")

    def __str__(self):
        return f"{self.student.username} - {self.assignment} - {self.score}"

    class Meta:
        verbose_name = "Оценка"
        verbose_name_plural = "Оценки"
        unique_together = ['student', 'assignment']


class CourseFile(models.Model):
    FILE_TYPES = [
        ('pdf', 'PDF'),
        ('image', 'Изображение'),
        ('video', 'Видео'),
        ('other', 'Другое'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='files')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='course_files/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class AnswerAttachment(models.Model):
    """Модель для файлов, прикрепленных к ответам учеников"""
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='attachments', verbose_name="Ответ")
    file = models.FileField(upload_to='answer_attachments/', verbose_name="Файл ответа")
    title = models.CharField(max_length=200, verbose_name="Название файла")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.grade.student.username} - {self.title}"

    class Meta:
        verbose_name = "Вложение ответа"
        verbose_name_plural = "Вложения ответов"