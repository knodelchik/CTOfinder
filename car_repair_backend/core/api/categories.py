# car_repair_backend/core/api/categories.py

from typing import List, Optional, Any
from ninja import Router, Schema
from core.models import ServiceCategory

router = Router()

# Схема для валідації відповіді
class CategoryTreeSchema(Schema):
    id: int
    name: str
    children: List['CategoryTreeSchema'] = []

# Дозволяємо рекурсію у схемі
try:
    CategoryTreeSchema.model_rebuild()
except AttributeError:
    CategoryTreeSchema.update_forward_refs()

@router.get("/tree", response=List[CategoryTreeSchema])
def get_categories_tree(request):
    # 1. Витягуємо ВСІ категорії одним швидким запитом (тільки потрібні поля)
    # Це повертає список словників: [{'id': 1, 'name': 'Двигун', 'parent_id': None}, ...]
    all_categories = list(ServiceCategory.objects.values('id', 'name', 'parent_id'))

    # 2. Створюємо "мапу" (словник) для швидкого пошуку по ID
    # category_map = { 1: {'id': 1, 'children': []}, ... }
    category_map = {}
    for cat in all_categories:
        cat['children'] = [] # Додаємо пустий список дітей кожному
        category_map[cat['id']] = cat

    # 3. Збираємо дерево
    roots = []
    for cat in all_categories:
        parent_id = cat['parent_id']
        
        if parent_id is None:
            # Якщо немає батька — це коренева категорія
            roots.append(cat)
        else:
            # Якщо є батько — знаходимо його в мапі і додаємо себе йому в діти
            if parent_id in category_map:
                category_map[parent_id]['children'].append(cat)

    # 4. Повертаємо тільки коріння (діти вже всередині них)
    return roots