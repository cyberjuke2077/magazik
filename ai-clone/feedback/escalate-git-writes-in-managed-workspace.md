---
name: escalate-git-writes-in-managed-workspace
type: feedback
---
Операции Git, которые пишут в `.git`, в managed workspace сразу запускать с
разрешением вне sandbox.

**Why:** обычный `git add` не смог создать `.git/index.lock`, потому что `.git`
доступен sandbox только для чтения.

**How to apply:** чтение статуса и diff оставлять в sandbox, а `git add`,
`git commit`, `git fetch` и `git push` запускать с узким явным разрешением.
