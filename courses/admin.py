from django.contrib import admin
from .models import Course, Lesson, Assignment, Grade, CourseFile, AnswerAttachment, Class

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'created_at')
    list_filter = ('grade',)
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'class_group', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('teacher', 'class_group')

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course',)
    search_fields = ('title', 'content')

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('question', 'lesson', 'question_type', 'correct_answer')
    list_filter = ('question_type', 'lesson__course')
    search_fields = ('question',)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'score', 'submitted_at')
    list_filter = ('assignment__lesson__course',)
    search_fields = ('student__username', 'feedback')

@admin.register(CourseFile)
class CourseFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'lesson', 'file_type', 'uploaded_at')
    list_filter = ('course', 'lesson', 'file_type')
    search_fields = ('title',)

@admin.register(AnswerAttachment)
class AnswerAttachmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'grade', 'uploaded_at')
    list_filter = ('grade__assignment__lesson__course',)
    search_fields = ('title', 'grade__student__username')