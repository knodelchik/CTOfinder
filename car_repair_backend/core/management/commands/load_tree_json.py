import json
import os
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.text import slugify
from core.models import ServiceCategory

class Command(BaseCommand):
    help = 'Завантажує категорії з читабельного JSON файлу (fixtures/services_tree.json)'

    def handle(self, *args, **kwargs):
        file_path = os.path.join(settings.BASE_DIR, 'core', 'fixtures', 'services_tree.json')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'Файл не знайдено: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.stdout.write("Очищення старих категорій...")
        ServiceCategory.objects.all().delete()

        # Рекурсивна функція для збереження
        def save_category(name, children_data, parent_obj=None):
            # Генеруємо читабельний, але унікальний slug
            base_slug = slugify(name) if name else 'cat'
            unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

            category = ServiceCategory.objects.create(
                name=name, 
                slug=unique_slug,
                parent=parent_obj
            )
            
            # Якщо діти - це список (кінцеві послуги: ["Заміна мастила", "Фільтр"])
            if isinstance(children_data, list):
                for item in children_data:
                    # Для кінцевих елементів теж створюємо категорії
                    item_slug = f"{slugify(item)}-{uuid.uuid4().hex[:6]}"
                    ServiceCategory.objects.create(
                        name=item, 
                        slug=item_slug,
                        parent=category
                    )
            
            # Якщо діти - це словник (є глибша вкладеність: {"ГРМ": [...]})
            elif isinstance(children_data, dict):
                for sub_name, sub_children in children_data.items():
                    save_category(sub_name, sub_children, category)

        self.stdout.write("Імпорт нових даних...")
        
        # Запускаємо рекурсію від кореня
        for root_name, root_children in data.items():
            save_category(root_name, root_children)

        self.stdout.write(self.style.SUCCESS(f'Успішно завантажено!'))