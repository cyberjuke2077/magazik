---
name: verify-vercel-hobby-commit-author
type: feedback
---
Перед deployment private repo на Vercel Hobby проверить, что автор deploy-коммита входит в целевую Vercel team; collaborator commit проводить через merge commit владельца team.

**Why:** CLI production deployment коммита `37Lunar` был заблокирован, хотя запускал его `cyberjuke2077`; Hobby проверяет автора Git commit, а не только пользователя CLI.

**How to apply:** при `Deployment Blocked`, работе с private GitHub repo и совместной разработке без Vercel Pro.
