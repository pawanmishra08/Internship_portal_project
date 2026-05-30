from django.contrib import admin
from .models import Skill, StudentProfile


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
	list_display = ('name', 'category')
	search_fields = ('name', 'category')
	list_filter = ('category',)
	ordering = ('name',)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'university', 'degree', 'is_available')
	search_fields = ('user__full_name', 'user__email', 'university')
	list_filter = ('degree', 'is_available')
	ordering = ('-created_at',)
