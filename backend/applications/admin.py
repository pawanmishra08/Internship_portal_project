from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from core.models import User


class CustomUserCreationForm(UserCreationForm):
	class Meta:
		model = User
		fields = ('email', 'full_name', 'role')


class CustomUserChangeForm(UserChangeForm):
	class Meta:
		model = User
		fields = ('email', 'full_name', 'role', 'is_active', 'is_staff')


class UserAdmin(BaseUserAdmin):
	add_form = CustomUserCreationForm
	form = CustomUserChangeForm
	model = User
	list_display = ('email', 'full_name', 'role', 'is_staff', 'is_superuser')
	list_filter = ('role', 'is_staff', 'is_superuser')
	search_fields = ('email', 'full_name')
	ordering = ('email',)
	fieldsets = (
		(None, {'fields': ('email', 'password')}),
		('Personal info', {'fields': ('full_name', 'role')}),
		('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
		('Important dates', {'fields': ('last_login',)}),
	)
	add_fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
		}),
	)


admin.site.register(User, UserAdmin)
