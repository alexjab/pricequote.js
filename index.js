const cloneDeep = require('lodash/cloneDeep')
const Decimal = require('decimal.js')

const defaultOptions = { currency: '', decimalPlaces: 2 }

function calculateProducts(_products, decimalPlaces) {
  const products = []
  const totals = {
    products: new Decimal(0)
  }

  for (const _product of _products) {
    const product = cloneDeep(_product)
    if (product.hasOwnProperty('quantity')) {
      product.total = product.value.mul(product.quantity).toDecimalPlaces(decimalPlaces)
    } else {
      product.total = product.value
    }

    products.push(product)
    totals.products = totals.products.add(product.total)
  }

  return { products, totals }
}

function calculateDiscounts(quote, _discounts, decimalPlaces) {
  const discounts = []
  const totals = {
    discounts: new Decimal(0)
  }
  let remaining = quote.totals.products

  for (const _discount of _discounts) {
    if (remaining.lte(0)) {
      break
    }

    const discount = cloneDeep(_discount)
    if (discount.amount) {
      discount.value = Decimal.min(discount.amount, remaining).toDecimalPlaces(decimalPlaces)
    }
    if (discount.percent) {
      discount.value = Decimal
				.min(discount.percent.mul(quote.totals.products).div(100), remaining)
        .toDecimalPlaces(decimalPlaces)
    }
    remaining = remaining.sub(discount.value)
    discount.total = discount.value.neg()

    discounts.push(discount)
    totals.discounts = totals.discounts.add(discount.total)
  }

  return { discounts, totals }
}

function decimalToHuman(quote) {
  for (const product of quote.products) {
    product.value = product.value.toNumber()
    product.total = product.total.toNumber()
  }
  for (const discount of quote.discounts) {
    if (discount.amount) {
      discount.amount = discount.amount.toNumber()
    }
    if (discount.percent) {
      discount.percent = discount.percent.toNumber()
    }
    discount.value = discount.value.toNumber()
    discount.total = discount.total.toNumber()
  }
  quote.totals.products = quote.totals.products.toNumber()
  quote.totals.discounts = quote.totals.discounts.toNumber()
  quote.totals.afterDiscounts = quote.totals.afterDiscounts.toNumber()

  return quote
}

class Quote {
  constructor(options) {
    Object.assign(this, defaultOptions, options)

    this.products = []
    this.discounts = []
  }

  addProduct(label, value, data) {
    const product = Object.assign(
      {
        label,
        value: new Decimal(value).toDecimalPlaces(this.decimalPlaces)
      },
      data
    )
    this.products.push(product)
  }

  addDiscountAmount(label, amount, extra) {
    const discount = Object.assign(
      {
        label,
        amount: new Decimal(amount).toDecimalPlaces(this.decimalPlaces)
      },
      extra
    )
    this.discounts.push(discount)
  }

  addDiscountPercent(label, percent, data) {
    const discount = Object.assign(
      {
        label,
        percent: new Decimal(percent).toDecimalPlaces(this.decimalPlaces)
      },
      data
    )
    this.discounts.push(discount)
  }

  toObject() {
    const quote = {
      products: null,
      discounts: null,
      totals: {
        products: null,
        discounts: null
      }
    }

    const {
      products,
      totals: {
        products: totalProducts
      }
    } = calculateProducts(this.products, this.decimalPlaces)
    quote.products = products
    quote.totals.products = totalProducts

    const {
      discounts,
      totals: {
        discounts: totalDiscounts
      }
    } = calculateDiscounts(quote, this.discounts, this.decimalPlaces)
    quote.discounts = discounts
    quote.totals.discounts = totalDiscounts

    quote.totals.afterDiscounts = quote.totals.products.add(quote.totals.discounts)

    decimalToHuman(quote)

    return Object.assign(
      {
        currency: this.currency
      },
      quote
    )
  }
}

module.exports = {
  Quote
}
