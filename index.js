const Intl = require('intl')

const Decimal = require('decimal.js')

const defaultOptions = {
  currency: '',
  decimalPlaces: 2,
  isBeforeTaxes: false,
  locale: 'en-US'
}

function calculateProducts (_products, decimalPlaces) {
  const products = []
  const totals = {
    products: new Decimal(0)
  }

  for (const _product of _products) {
    const product = Object.assign({}, _product)
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

function calculateDiscounts (quote, _discounts, decimalPlaces) {
  const discounts = []
  const totals = {
    discounts: new Decimal(0)
  }
  let remaining = quote.totals.products

  for (const _discount of _discounts) {
    if (remaining.lte(0)) {
      break
    }

    const discount = Object.assign({}, _discount)
    if (discount.amount) {
      discount.value = Decimal.min(discount.amount, remaining).toDecimalPlaces(decimalPlaces)
    }
    if (discount.percent) {
      discount.value = Decimal
        .min(discount.percent.mul(quote.totals.products).div(100), remaining)
        .toDecimalPlaces(decimalPlaces)
    }

    discount.total = discount.value.neg()

    discounts.push(discount)
    totals.discounts = totals.discounts.add(discount.total)

    remaining = remaining.sub(discount.value)
  }

  return { discounts, totals }
}

function calculateTax (quote, tax, isBeforeTaxes, decimalPlaces) {
  let beforeTaxes
  let afterTaxes
  const taxes = []

  if (isBeforeTaxes) {
    beforeTaxes = quote.totals.afterDiscounts
    afterTaxes = quote.totals.afterDiscounts.mul(
      new Decimal(1).add(tax.rate.div(100))
    ).toDecimalPlaces(decimalPlaces)
  } else {
    afterTaxes = quote.totals.afterDiscounts
    beforeTaxes = quote.totals.afterDiscounts.div(
      new Decimal(1).add(tax.rate.div(100))
    ).toDecimalPlaces(decimalPlaces)
  }
  const totalTaxes = afterTaxes.sub(beforeTaxes)
  taxes.push({
    label: tax.label,
    rate: tax.rate,
    value: totalTaxes
  })

  return { taxes, totals: { beforeTaxes, afterTaxes, taxes: totalTaxes } }
}

function decimalToHuman (quote, hasTax, options, intl) {
  for (const product of quote.products) {
    product.value = product.value.toNumber()
    product.total = product.total.toNumber()

    if (options.display) {
      if (!options.snakeCase) {
        product.displayValue = intl.format(product.value)
        product.displayTotal = intl.format(product.total)
      } else {
        product.display_value = intl.format(product.value)
        product.display_total = intl.format(product.total)
      }
    }
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

    if (options.display) {
      if (!options.snakeCase) {
        discount.displayValue = intl.format(discount.value)
        discount.displayTotal = intl.format(discount.total)
      } else {
        discount.display_value = intl.format(discount.value)
        discount.display_total = intl.format(discount.total)
      }
    }
  }
  quote.totals.products = quote.totals.products.toNumber()
  quote.totals.discounts = quote.totals.discounts.toNumber()
  if (!options.snakeCase) {
    quote.totals.afterDiscounts = quote.totals.afterDiscounts.toNumber()
  } else {
    quote.totals.after_discounts = quote.totals.after_discounts.toNumber()
  }

  if (options.display) {
    if (!options.snakeCase) {
      quote.totals.displayProducts = intl.format(quote.totals.products)
      quote.totals.displayDiscounts = intl.format(quote.totals.discounts)
      quote.totals.displayAfterDiscounts = intl.format(quote.totals.afterDiscounts)
    } else {
      quote.totals.display_products = intl.format(quote.totals.products)
      quote.totals.display_discounts = intl.format(quote.totals.discounts)
      quote.totals.display_after_discounts = intl.format(quote.totals.after_discounts)
    }
  }

  if (hasTax) {
    for (const tax of quote.taxes) {
      tax.rate = tax.rate.toNumber()
      tax.value = tax.value.toNumber()
    }

    if (!options.snakeCase) {
      quote.totals.beforeTaxes = quote.totals.beforeTaxes.toNumber()
      quote.totals.afterTaxes = quote.totals.afterTaxes.toNumber()
    } else {
      quote.totals.before_taxes = quote.totals.before_taxes.toNumber()
      quote.totals.after_taxes = quote.totals.after_taxes.toNumber()
    }
    quote.totals.taxes = quote.totals.taxes.toNumber()
  }
}

function removeUnusedFields (quote, hasTax, options) {
  for (const product of quote.products) {
    if (!options.display || options.snakeCase) {
      delete product.displayValue
      delete product.displayTotal
    }
    if (!options.display || !options.snakeCase) {
      delete product.display_value
      delete product.display_total
    }
  }

  for (const discount of quote.discounts) {
    if (!options.display || options.snakeCase) {
      delete discount.displayValue
      delete discount.displayTotal
    }
    if (!options.display || !options.snakeCase) {
      delete discount.display_value
      delete discount.display_total
    }
  }

  if (!options.display || options.snakeCase) {
    delete quote.totals.displayProducts
    delete quote.totals.displayDiscounts
    delete quote.totals.displayAfterDiscounts
  }
  if (!options.display || !options.snakeCase) {
    delete quote.totals.display_products
    delete quote.totals.display_discounts
    delete quote.totals.display_after_discounts
  }

  if (!hasTax) {
    delete quote.taxes
  }
}

class Quote {
  constructor (options) {
    Object.assign(this, defaultOptions, options)

    this.products = []
    this.discounts = []
    if (this.currency) {
      this.intl = new Intl.NumberFormat(this.locale, { style: 'currency', currency: this.currency })
    } else {
      this.intl = new Intl.NumberFormat(this.locale)
    }
  }

  addProduct (label, value, data) {
    const product = Object.assign(
      {
        label,
        value: new Decimal(value).toDecimalPlaces(this.decimalPlaces),
        display_value: null,
        displayValue: null
      },
      data
    )
    this.products.push(product)
  }

  addDiscountAmount (label, amount, extra) {
    const discount = Object.assign(
      {
        label,
        amount: new Decimal(amount).toDecimalPlaces(this.decimalPlaces),
        value: null,
        display_value: null,
        displayValue: null
      },
      extra
    )
    this.discounts.push(discount)
  }

  addDiscountPercent (label, percent, data) {
    const discount = Object.assign(
      {
        label,
        percent: new Decimal(percent).toDecimalPlaces(this.decimalPlaces),
        value: null,
        display_value: null,
        displayValue: null
      },
      data
    )
    this.discounts.push(discount)
  }

  setTax (label, rate) {
    this.tax = {
      label,
      rate: new Decimal(rate)
    }
  }

  toObject (options) {
    options = Object.assign({ display: false }, options)

    const quote = {
      products: null,
      discounts: null,
      taxes: null
    };

    let totals;
    if (!options.snakeCase) {
      totals = {
        products: null,
        displayProducts: null,
        discounts: null,
        displayDiscounts: null,
        afterDiscounts: null,
        displayAfterDiscounts: null
      }
    } else {
      totals = {
        products: null,
        display_products: null,
        discounts: null,
        display_discounts: null,
        after_discounts: null,
        display_after_discounts: null
      }
    }
    quote.totals = totals

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

    const afterDiscounts = quote.totals.products.add(quote.totals.discounts)
    if (!options.snakeCase) {
      quote.totals.afterDiscounts = afterDiscounts
    } else {
      quote.totals.after_discounts = afterDiscounts
    }

    if (this.tax) {
      const {
        taxes,
        totals: {
          beforeTaxes: totalBeforeTaxes,
          afterTaxes: totalAfterTaxes,
          taxes: totalTaxes
        }
      } = calculateTax(quote, this.tax, this.isBeforeTaxes, this.decimalPlaces)
      quote.taxes = taxes
      if (!options.snakeCase) {
        quote.totals.beforeTaxes = totalBeforeTaxes
        quote.totals.afterTaxes = totalAfterTaxes
      } else {
        quote.totals.before_taxes = totalBeforeTaxes
        quote.totals.after_taxes = totalAfterTaxes
      }
      quote.totals.taxes = totalTaxes
    }

    decimalToHuman(quote, this.tax, options, this.intl)
    removeUnusedFields(quote, this.tax, options)

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
