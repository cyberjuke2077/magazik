export class RingBuffer<T> {
  private items: T[] = []
  private cursor = 0
  private filled = false

  constructor(private readonly capacity: number) {
    if (capacity < 0) throw new Error('RingBuffer capacity must be >= 0')
  }

  push(item: T): void {
    if (this.capacity === 0) return
    this.items[this.cursor] = item
    this.cursor = (this.cursor + 1) % this.capacity
    if (!this.filled && this.cursor === 0) this.filled = true
  }

  get size(): number {
    return this.filled ? this.capacity : this.cursor
  }

  // Returns elements in order from newest to oldest.
  toArray(): T[] {
    if (this.size === 0) return []
    const result: T[] = []
    if (!this.filled) {
      for (let i = this.cursor - 1; i >= 0; i--) result.push(this.items[i])
      return result
    }
    // Filled buffer: cursor points to oldest. Walk backwards from (cursor - 1).
    for (let i = 0; i < this.capacity; i++) {
      const idx = (this.cursor - 1 - i + this.capacity) % this.capacity
      result.push(this.items[idx])
    }
    return result
  }
}
