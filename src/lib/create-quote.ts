import type { Prisma } from '@prisma/client'
import type { QuoteRequestInput } from '@/app/request-list/actions'
import { SubmissionConflictError } from '@/lib/save-submission'

async function quoteItems(tx: Prisma.TransactionClient, input: QuoteRequestInput) {
  const products = await tx.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) } },
    select: { id: true, partNumber: true, name: true, minOrder: true },
  })
  const byId = new Map(products.map((product) => [product.id, product]))
  return input.items.map((item) => {
    const product = byId.get(item.productId)
    if (!product) throw new SubmissionConflictError('Один из товаров больше недоступен. Обновите корзину.')
    if (item.quantity < product.minOrder) {
      throw new SubmissionConflictError(`Минимальная партия ${product.partNumber}: ${product.minOrder} шт.`)
    }
    return { productId: product.id, partNumber: product.partNumber, name: product.name, quantity: item.quantity }
  })
}

export async function createQuote(tx: Prisma.TransactionClient, input: QuoteRequestInput) {
  const items = await quoteItems(tx, input)
  return tx.quoteRequest.create({ data: {
    status: 'new', companyName: input.companyName.trim(), inn: input.inn?.trim() || null,
    contactPerson: input.contactPerson.trim(), phone: input.phone.trim(), email: input.email.trim(),
    comment: input.comment?.trim() || null, deliveryAddress: input.deliveryAddress?.trim() || null,
    desiredDeliveryDate: input.desiredDeliveryDate ? new Date(input.desiredDeliveryDate) : null,
    consentAt: new Date(), items: { create: items },
  } })
}
