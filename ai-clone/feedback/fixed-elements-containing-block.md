---
name: fixed-elements-containing-block
type: feedback
---
Проверять fixed-элементы после добавления transform, filter или backdrop-filter
их предкам; мобильное меню должно оставаться у нижней границы viewport.

**Why:** при редизайне 2026-09-20 backdrop-filter на sticky-шапке изменил
containing block вложенного fixed-меню: оно перекрыло поиск. Эффект удалён
до commit. E2E проверяет координату меню и возможность перейти в корзину
при открытой панели сравнения.

**How to apply:** при изменении шапки, анимаций, модальных и плавающих панелей
проверять desktop/mobile в настоящем браузере, включая клики и bounding box.
