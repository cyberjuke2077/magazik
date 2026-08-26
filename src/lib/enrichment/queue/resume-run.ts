import { prisma } from '../../prisma'

export interface ResumableRun {
  id: string
  totalProducts: number
  startedAt: Date | null
}

export async function loadResumableRun(): Promise<ResumableRun> {
  const existing = await prisma.importProgress.findFirst({
    where: {
      status: { in: ['running', 'paused'] },
      completedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, totalProducts: true, startedAt: true },
  })

  if (!existing) {
    throw new Error(
      'Нет незавершённого запуска. Сначала начните новый полный или пакетный запуск.',
    )
  }
  return existing
}
