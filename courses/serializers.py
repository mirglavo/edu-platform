from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Course, Lesson, Assignment, Grade, CourseFile, AnswerAttachment, Class


class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'grade', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'password2', 'email', 'first_name', 'last_name', 'is_staff',
                  'full_name']
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher', 'teacher_name', 'class_group', 'class_name', 'created_at']
        extra_kwargs = {
            'teacher': {'required': False},
            'class_group': {'required': False, 'allow_null': True}
        }

    def get_teacher_name(self, obj):
        if obj.teacher.first_name and obj.teacher.last_name:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return obj.teacher.username

    def get_class_name(self, obj):
        if obj.class_group:
            return f"{obj.class_group.name} ({obj.class_group.grade} класс)"
        return "Не указан"

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'course', 'order', 'created_at']


class AssignmentSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ['id', 'lesson', 'question', 'question_type', 'correct_answer', 'attachment', 'attachment_url']

    def get_attachment_url(self, obj):
        if obj.attachment:
            return obj.attachment.url
        return None


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = ['id', 'student', 'student_name', 'assignment', 'score', 'feedback', 'submitted_at', 'attachments']

    def get_student_name(self, obj):
        if obj.student.first_name and obj.student.last_name:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return obj.student.username

    def get_attachments(self, obj):
        attachments = AnswerAttachment.objects.filter(grade=obj)
        return AnswerAttachmentSerializer(attachments, many=True).data


class SubmitAnswerSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    answer = serializers.CharField(required=False, allow_blank=True)


class SubmitAnswerWithFilesSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    answer = serializers.CharField(required=False, allow_blank=True)
    files = serializers.ListField(child=serializers.FileField(), required=False)


class CourseFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseFile
        fields = ['id', 'course', 'lesson', 'title', 'file', 'file_type', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class AnswerAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = AnswerAttachment
        fields = ['id', 'grade', 'file', 'title', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None