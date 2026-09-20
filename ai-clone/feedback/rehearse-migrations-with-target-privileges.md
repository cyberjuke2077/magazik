---
name: rehearse-migrations-with-target-privileges
type: feedback
---
Репетировать production-миграции под ролью с правами целевого migration endpoint, включая отсутствие SUPERUSER и BYPASSRLS.

**Why:** локальная репетиция под postgres-superuser пропустила запрет Supabase на `ALTER ROLE ... NOSUPERUSER`, даже когда атрибут уже выключен. Production-транзакция откатилась целиком; исправление оставляет безопасную роль без лишнего ALTER и не скрывает небезопасные атрибуты.

**How to apply:** восстановить backup в изолированную БД, назначить владельца объектов без SUPERUSER/BYPASSRLS и выполнить миграции от его имени. Отдельно проверить runtime CRUD, anonymous denial и rollback. До повторной попытки на production проверить отсутствие частичных изменений и актуальные checksum.
