from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth.models import User
from .models import Course, Lesson, Assignment, Grade, CourseFile, AnswerAttachment, Class
from .serializers import (
    UserSerializer, CourseSerializer, LessonSerializer,
    AssignmentSerializer, GradeSerializer, SubmitAnswerSerializer,
    SubmitAnswerWithFilesSerializer, CourseFileSerializer, AnswerAttachmentSerializer, ClassSerializer
)


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    authentication_classes = [TokenAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]

    def get_permissions(self):
        if self.action == 'create':
            return []
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def teachers(self, request):
        teachers = User.objects.filter(is_staff=True)
        serializer = UserSerializer(teachers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def students(self, request):
        students = User.objects.filter(is_staff=False)
        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Course.objects.all()
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(class_group_id=class_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=['get'])
    def lessons(self, request, pk=None):
        course = self.get_object()
        lessons = Lesson.objects.filter(course=course)
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_course(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Только учителя могут создавать курсы'}, status=403)

        data = request.data.copy()
        data['teacher'] = request.user.id

        if data.get('class_group') == '':
            data['class_group'] = None

        serializer = CourseSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            print("Ошибки валидации:", serializer.errors)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def add_lesson(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Только учителя могут добавлять уроки'}, status=403)

        course = self.get_object()
        data = request.data.copy()
        data['course'] = course.id

        serializer = LessonSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def add_assignment(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Только учителя могут добавлять задания'}, status=403)

        lesson_id = request.data.get('lesson_id')
        try:
            lesson = Lesson.objects.get(id=lesson_id, course_id=pk)
        except Lesson.DoesNotExist:
            return Response({'error': 'Урок не найден'}, status=404)

        data = {
            'lesson': lesson.id,
            'question': request.data.get('question'),
            'question_type': request.data.get('question_type', 'test'),
            'correct_answer': request.data.get('correct_answer', '')
        }

        serializer = AssignmentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        lesson = self.get_object()
        assignments = Assignment.objects.filter(lesson=lesson)
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Assignment.objects.all()
        return Assignment.objects.filter(lesson__course__teacher=self.request.user)


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Grade.objects.all()
        return Grade.objects.filter(student=user)

    @action(detail=False, methods=['get'])
    def my_grades(self, request):
        grades = Grade.objects.filter(student=request.user).select_related('assignment__lesson__course')

        result = []
        for grade in grades:
            attachments = AnswerAttachment.objects.filter(grade=grade)
            result.append({
                'id': grade.id,
                'course_name': grade.assignment.lesson.course.title,
                'lesson_name': grade.assignment.lesson.title,
                'question': grade.assignment.question,
                'score': grade.score,
                'feedback': grade.feedback,
                'submitted_at': grade.submitted_at,
                'attachments': AnswerAttachmentSerializer(attachments, many=True).data
            })

        return Response(result)


class CourseFileViewSet(viewsets.ModelViewSet):
    queryset = CourseFile.objects.all()
    serializer_class = CourseFileSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course')
        lesson_id = self.request.query_params.get('lesson')

        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        elif course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset


class AnswerAttachmentViewSet(viewsets.ModelViewSet):
    queryset = AnswerAttachment.objects.all()
    serializer_class = AnswerAttachmentSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return AnswerAttachment.objects.all()
        return AnswerAttachment.objects.filter(grade__student=self.request.user)


class TeacherViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def all_submissions(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ только для учителей'}, status=403)

        teacher_courses = Course.objects.filter(teacher=request.user).values_list('id', flat=True)

        grades = Grade.objects.filter(
            assignment__lesson__course_id__in=teacher_courses
        ).select_related('student', 'assignment__lesson__course')

        class_id = request.query_params.get('class')
        if class_id:
            grades = grades.filter(assignment__lesson__course__class_group_id=class_id)

        result = []
        for grade in grades:
            attachments = AnswerAttachment.objects.filter(grade=grade)

            student_name = grade.student.username
            if grade.student.first_name and grade.student.last_name:
                student_name = f"{grade.student.first_name} {grade.student.last_name}"

            result.append({
                'id': grade.id,
                'student_name': student_name,
                'student_id': grade.student.id,
                'course_name': grade.assignment.lesson.course.title,
                'course_id': grade.assignment.lesson.course.id,
                'lesson_name': grade.assignment.lesson.title,
                'question': grade.assignment.question,
                'answer': grade.feedback,
                'score': grade.score,
                'submitted_at': grade.submitted_at,
                'assignment_id': grade.assignment.id,
                'attachments': AnswerAttachmentSerializer(attachments, many=True).data
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def course_stats(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ только для учителей'}, status=403)

        courses = Course.objects.filter(teacher=request.user)

        class_id = request.query_params.get('class')
        if class_id:
            courses = courses.filter(class_group_id=class_id)

        result = []
        for course in courses:
            lessons = Lesson.objects.filter(course=course)
            total_assignments = Assignment.objects.filter(lesson__in=lessons).count()
            completed_assignments = Grade.objects.filter(assignment__lesson__course=course).count()

            result.append({
                'course_id': course.id,
                'course_title': course.title,
                'total_assignments': total_assignments,
                'completed_assignments': completed_assignments,
                'students_count': 0
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ только для учителей'}, status=403)

        courses = Course.objects.filter(teacher=request.user)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def update_grade(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ только для учителей'}, status=403)

        grade_id = request.data.get('grade_id')
        new_score = request.data.get('score')
        feedback = request.data.get('feedback', '')

        try:
            grade = Grade.objects.get(id=grade_id)

            if grade.assignment.lesson.course.teacher != request.user:
                return Response({'error': 'У вас нет прав на изменение этой оценки'}, status=403)

            grade.score = new_score
            grade.feedback = feedback
            grade.save()

            return Response({
                'status': 'success',
                'message': 'Оценка обновлена',
                'score': grade.score
            })
        except Grade.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Оценка не найдена'
            }, status=404)


class StatisticsViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        user = request.user
        courses = Course.objects.all()

        progress = []
        for course in courses:
            lessons = Lesson.objects.filter(course=course)
            total_lessons = lessons.count()

            completed_lessons = Grade.objects.filter(
                student=user,
                assignment__lesson__course=course
            ).values('assignment__lesson').distinct().count()

            progress.append({
                'course_id': course.id,
                'course_title': course.title,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percent': int(completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            })

        return Response(progress)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request):
    if request.FILES:
        serializer = SubmitAnswerWithFilesSerializer(data=request.data)
    else:
        serializer = SubmitAnswerSerializer(data=request.data)

    if serializer.is_valid():
        assignment_id = serializer.validated_data['assignment_id']
        answer = serializer.validated_data.get('answer', '')

        try:
            assignment = Assignment.objects.get(id=assignment_id)

            is_correct = False
            score = None

            if assignment.question_type == 'test':
                is_correct = answer.lower().strip() == assignment.correct_answer.lower().strip()
                score = 100 if is_correct else 0
            else:
                score = None

            grade, created = Grade.objects.update_or_create(
                student=request.user,
                assignment=assignment,
                defaults={
                    'score': score,
                    'feedback': answer
                }
            )

            files = request.FILES.getlist('files')
            for file in files:
                AnswerAttachment.objects.create(
                    grade=grade,
                    file=file,
                    title=file.name
                )

            return Response({
                'status': 'success',
                'score': score,
                'correct': is_correct if assignment.question_type == 'test' else None,
                'grade_id': grade.id,
                'attachments_count': len(files)
            }, status=status.HTTP_201_CREATED)

        except Assignment.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Задание не найдено'
            }, status=status.HTTP_404_NOT_FOUND)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)