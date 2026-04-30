from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'classes', views.ClassViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'lessons', views.LessonViewSet)
router.register(r'assignments', views.AssignmentViewSet)
router.register(r'grades', views.GradeViewSet)
router.register(r'files', views.CourseFileViewSet)
router.register(r'answer-attachments', views.AnswerAttachmentViewSet)
router.register(r'teacher', views.TeacherViewSet, basename='teacher')
router.register(r'statistics', views.StatisticsViewSet, basename='statistics')

urlpatterns = [
    path('', include(router.urls)),
    path('submit-answer/', views.submit_answer, name='submit-answer'),
]