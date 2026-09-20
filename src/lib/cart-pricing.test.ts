import { expect, it } from 'vitest'
import { cartSummary } from './cart-pricing'
import type { Product } from '@/types'
it('uses wholesale pricing and never treats unknown prices as a complete total', () => {
  const product = {price:100,priceWholesale:80,minOrder:10} as Product
  expect(cartSummary([{product,quantity:10}])).toEqual({total:800,unpriced:0})
  expect(cartSummary([{product,quantity:2},{product:{...product,price:0,priceWholesale:undefined},quantity:1}]))
    .toEqual({total:200,unpriced:1})
})
