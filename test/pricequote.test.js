const Decimal = require('decimal.js')

const { expect } = require('chai')

const { Quote } = require('../')

describe('pricequote', () => {
  describe('new Quote()', () => {
    it('should create a new quote', () => {
      const quote = new Quote()
      expect(quote).to.exist()
      expect(quote).to.have.property('addProduct').that.is.a('function')
      expect(quote).to.have.property('addDiscountAmount').that.is.a('function')
      expect(quote).to.have.property('addDiscountPercent').that.is.a('function')
      expect(quote).to.have.property('toObject').that.is.a('function')
    })
  })

  describe('.addProduct(label, amount, data)', () => {
    it('should add a product to a quote', () => {
      const quote = new Quote()
      quote.addProduct('Some product', 0.99)
      expect(quote).to.have.property('products')
        .that.deep.equal([
          {
            label: 'Some product',
            value: new Decimal(0.99),
            displayValue: null,
            display_value: null
          }
        ])
    })
  })

  describe('.addDiscountAmount(label, value, data)', () => {
    it('should add a discount (amount) to a quote', () => {
      const quote = new Quote()
      quote.addDiscountAmount('Some discount', 5)

      expect(quote).to.have.property('discounts')
        .that.deep.equal([
          {
            label: 'Some discount',
            amount: new Decimal(5),
            value: null,
            displayValue: null,
            display_value: null
          }
        ])
    })
  })

  describe('.addDiscountPercent(label, value, data)', () => {
    it('should add a discount (percent) to a quote', () => {
      const quote = new Quote()
      quote.addDiscountPercent('Some discount', 10)

      expect(quote).to.have.property('discounts')
        .that.deep.equal([
          {
            label: 'Some discount',
            percent: new Decimal(10),
            value: null,
            displayValue: null,
            display_value: null
          }
        ])
    })
  })

  describe('.toObject()', () => {
    it('should return an empty quote (empty quote)', () => {
      const quote = new Quote()

      expect(quote.toObject()).to.deep.equal({
        currency: '',
        products: [],
        discounts: [],
        totals: {
          products: 0,
          discounts: 0,
          afterDiscounts: 0
        }
      })
    })

    it('should calculate a quote object (products only quote)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pasta', 3.19, { id: 'cd75d' })
      quote.addProduct('Lettuce', 2.09, { id: '64c34' })
      quote.addProduct('Ham', 3.29, { id: 'f0274' })
      quote.addProduct('Pine nuts', 4.99, { id: 'f6480' })

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pasta',
            value: 3.19,
            id: 'cd75d',
            total: 3.19
          },
          {
            label: 'Lettuce',
            value: 2.09,
            id: '64c34',
            total: 2.09
          },
          {
            label: 'Ham',
            value: 3.29,
            id: 'f0274',
            total: 3.29
          },
          {
            label: 'Pine nuts',
            value: 4.99,
            id: 'f6480',
            total: 4.99
          }
        ],
        discounts: [],
        totals: {
          products: 13.56,
          discounts: 0,
          afterDiscounts: 13.56
        }
      })
    })

    it('should apply the default decimal places (2)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 11.2 + 1.1, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.2 + 0.2 + 0.1, { id: 'caa93' })
      quote.addDiscountPercent('PROMO10', 8.3 + 1.1 + 0.6)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 12.30,
            id: 'ce0b9',
            quantity: 2,
            total: 24.60
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            percent: 10,
            value: 2.71,
            total: -2.71
          }
        ],
        totals: {
          products: 27.1,
          discounts: -2.71,
          afterDiscounts: 24.39
        }
      })
    })

    it('should apply the requested decimal places', () => {
      const quote = new Quote({ currency: 'EUR', decimalPlaces: 3 })
      quote.addProduct('Pizza', 12.31442, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.4956, { id: 'caa93' })
      quote.addDiscountAmount('PROMO5', 4.91999)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 12.314,
            id: 'ce0b9',
            quantity: 2,
            total: 24.628
          },
          {
            label: 'Delivery fee',
            value: 2.496,
            id: 'caa93',
            total: 2.496
          }
        ],
        discounts: [
          {
            label: 'PROMO5',
            amount: 4.92,
            value: 4.92,
            total: -4.92
          }
        ],
        totals: {
          products: 27.124,
          discounts: -4.92,
          afterDiscounts: 22.204
        }
      })
    })

    it('should apply the discount (products and percent discount)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountPercent('PROMO20', 20)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO20',
            percent: 20,
            value: 5.78,
            total: -5.78
          }
        ],
        totals: {
          products: 28.90,
          discounts: -5.78,
          afterDiscounts: 23.12
        }
      })
    })

    it('should apply part of the discount (percent discount, more than products)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountPercent('PROMO110', 110)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO110',
            percent: 110,
            value: 28.9,
            total: -28.9
          }
        ],
        totals: {
          products: 28.90,
          discounts: -28.9,
          afterDiscounts: 0
        }
      })
    })

    it('should apply part of the discount (percent discounts, more than products)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountPercent('PROMO60', 60)
      quote.addDiscountPercent('PROMO70', 70)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO60',
            percent: 60,
            value: 17.34,
            total: -17.34
          },
          {
            label: 'PROMO70',
            percent: 70,
            value: 11.56,
            total: -11.56
          }
        ],
        totals: {
          products: 28.90,
          discounts: -28.9,
          afterDiscounts: 0
        }
      })
    })

    it('should apply the discount (products and amount discount)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            total: -10
          }
        ],
        totals: {
          products: 28.90,
          discounts: -10,
          afterDiscounts: 18.90
        }
      })
    })

    it('should apply part of the discount (amount discount, more than products)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO50', 50)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO50',
            amount: 50,
            value: 28.9,
            total: -28.9
          }
        ],
        totals: {
          products: 28.90,
          discounts: -28.90,
          afterDiscounts: 0
        }
      })
    })

    it('should apply part of the discount (amount discounts, more than products)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)
      quote.addDiscountAmount('PROMO20', 20)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            total: -10
          },
          {
            label: 'PROMO20',
            amount: 20,
            value: 18.9,
            total: -18.9
          }
        ],
        totals: {
          products: 28.90,
          discounts: -28.90,
          afterDiscounts: 0
        }
      })
    })

    it('should not display the last discount (amount discounts, way more than products)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)
      quote.addDiscountAmount('PROMO20', 20)
      quote.addDiscountAmount('PROMO15', 15)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            total: -10
          },
          {
            label: 'PROMO20',
            amount: 20,
            value: 18.9,
            total: -18.9
          }
        ],
        totals: {
          products: 28.90,
          discounts: -28.90,
          afterDiscounts: 0
        }
      })
    })

    it('should return a quote with display option enabled (with currency)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)

      const data = quote.toObject({ display: true })

      expect(data).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            displayValue: '€13.20',
            id: 'ce0b9',
            quantity: 2,
            total: 26.40,
            displayTotal: '€26.40'
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            displayValue: '€2.50',
            id: 'caa93',
            total: 2.50,
            displayTotal: '€2.50'
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            displayValue: '€10.00',
            total: -10,
            displayTotal: '-€10.00'
          }
        ],
        totals: {
          products: 28.90,
          displayProducts: '€28.90',
          discounts: -10,
          displayDiscounts: '-€10.00',
          afterDiscounts: 18.90,
          displayAfterDiscounts: '€18.90'
        }
      })

      expect(JSON.stringify(data, null, 2)).to.deep.equal(`{
  "currency": "EUR",
  "products": [
    {
      "label": "Pizza",
      "value": 13.2,
      "displayValue": "€13.20",
      "id": "ce0b9",
      "quantity": 2,
      "total": 26.4,
      "displayTotal": "€26.40"
    },
    {
      "label": "Delivery fee",
      "value": 2.5,
      "displayValue": "€2.50",
      "id": "caa93",
      "total": 2.5,
      "displayTotal": "€2.50"
    }
  ],
  "discounts": [
    {
      "label": "PROMO10",
      "amount": 10,
      "value": 10,
      "displayValue": "€10.00",
      "total": -10,
      "displayTotal": "-€10.00"
    }
  ],
  "totals": {
    "products": 28.9,
    "displayProducts": "€28.90",
    "discounts": -10,
    "displayDiscounts": "-€10.00",
    "afterDiscounts": 18.9,
    "displayAfterDiscounts": "€18.90"
  }
}`)
    })

    it('should return a quote with display option enabled (language is fr-FR)', () => {
      const quote = new Quote({ currency: 'EUR', locale: 'fr-FR' })
      quote.addProduct('Golden Pizza', 1013.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)

      expect(quote.toObject({ display: true })).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Golden Pizza',
            value: 1013.20,
            displayValue: '1 013,20 €', // This is UTF-16 160 (no-break space)
            id: 'ce0b9',
            quantity: 2,
            total: 2026.40,
            displayTotal: '2 026,40 €'
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            displayValue: '2,50 €',
            id: 'caa93',
            total: 2.50,
            displayTotal: '2,50 €'
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            displayValue: '10,00 €',
            total: -10,
            displayTotal: '-10,00 €'
          }
        ],
        totals: {
          products: 2028.90,
          displayProducts: '2 028,90 €',
          discounts: -10,
          displayDiscounts: '-10,00 €',
          afterDiscounts: 2018.90,
          displayAfterDiscounts: '2 018,90 €'
        }
      })
    })

    it('should return a quote with display option enabled (language is de-DE)', () => {
      const quote = new Quote({ currency: 'EUR', locale: 'de-DE' })
      quote.addProduct('Golden Pizza', 1013.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)

      expect(quote.toObject({ display: true })).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Golden Pizza',
            value: 1013.20,
            displayValue: '1.013,20 €', // This is UTF-16 160 (no-break space)
            id: 'ce0b9',
            quantity: 2,
            total: 2026.40,
            displayTotal: '2.026,40 €'
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            displayValue: '2,50 €',
            id: 'caa93',
            total: 2.50,
            displayTotal: '2,50 €'
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            displayValue: '10,00 €',
            total: -10,
            displayTotal: '-10,00 €'
          }
        ],
        totals: {
          products: 2028.90,
          displayProducts: '2.028,90 €',
          discounts: -10,
          displayDiscounts: '-10,00 €',
          afterDiscounts: 2018.90,
          displayAfterDiscounts: '2.018,90 €'
        }
      })
    })

    it('should return a quote with display option enabled (with snake case)', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountAmount('PROMO10', 10)

      const data = quote.toObject({ display: true, snakeCase: true })

      expect(data).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            display_value: '€13.20',
            id: 'ce0b9',
            quantity: 2,
            total: 26.40,
            display_total: '€26.40'
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            display_value: '€2.50',
            id: 'caa93',
            total: 2.50,
            display_total: '€2.50'
          }
        ],
        discounts: [
          {
            label: 'PROMO10',
            amount: 10,
            value: 10,
            display_value: '€10.00',
            total: -10,
            display_total: '-€10.00'
          }
        ],
        totals: {
          products: 28.90,
          display_products: '€28.90',
          discounts: -10,
          display_discounts: '-€10.00',
          after_discounts: 18.90,
          display_after_discounts: '€18.90'
        }
      })

      expect(JSON.stringify(data, null, 2)).to.deep.equal(`{
  "currency": "EUR",
  "products": [
    {
      "label": "Pizza",
      "value": 13.2,
      "display_value": "€13.20",
      "id": "ce0b9",
      "quantity": 2,
      "total": 26.4,
      "display_total": "€26.40"
    },
    {
      "label": "Delivery fee",
      "value": 2.5,
      "display_value": "€2.50",
      "id": "caa93",
      "total": 2.5,
      "display_total": "€2.50"
    }
  ],
  "discounts": [
    {
      "label": "PROMO10",
      "amount": 10,
      "value": 10,
      "display_value": "€10.00",
      "total": -10,
      "display_total": "-€10.00"
    }
  ],
  "totals": {
    "products": 28.9,
    "display_products": "€28.90",
    "discounts": -10,
    "display_discounts": "-€10.00",
    "after_discounts": 18.9,
    "display_after_discounts": "€18.90"
  }
}`)
    })

    it('should calculate the tax', () => {
      const quote = new Quote({ currency: 'EUR' })
      quote.addProduct('Pizza', 13.20, { id: 'ce0b9', quantity: 2 })
      quote.addProduct('Delivery fee', 2.50, { id: 'caa93' })
      quote.addDiscountPercent('PROMO20', 20)
      quote.setTax('VAT', 20)

      expect(quote.toObject()).to.deep.equal({
        currency: 'EUR',
        products: [
          {
            label: 'Pizza',
            value: 13.20,
            id: 'ce0b9',
            quantity: 2,
            total: 26.40
          },
          {
            label: 'Delivery fee',
            value: 2.50,
            id: 'caa93',
            total: 2.50
          }
        ],
        discounts: [
          {
            label: 'PROMO20',
            percent: 20,
            value: 5.78,
            total: -5.78
          }
        ],
        taxes: [
          {
            label: 'VAT',
            rate: 20,
            value: 3.85
          }
        ],
        totals: {
          products: 28.90,
          discounts: -5.78,
          afterDiscounts: 23.12,
          beforeTaxes: 19.27,
          afterTaxes: 23.12,
          taxes: 3.85
        }
      })
    })
  })
})
