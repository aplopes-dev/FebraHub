
# CheckoutPreview200ResponseData


## Properties

Name | Type
------------ | -------------
`subtotal` | number
`shipping` | number
`couponDiscount` | number
`pixDiscount` | number
`total` | number
`pixDiscountPercent` | number
`installmentOptions` | [Array&lt;CheckoutPreview200ResponseDataAllOfInstallmentOptionsInner&gt;](CheckoutPreview200ResponseDataAllOfInstallmentOptionsInner.md)
`canConfirm` | boolean
`validationErrors` | Array&lt;string&gt;

## Example

```typescript
import type { CheckoutPreview200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "subtotal": null,
  "shipping": null,
  "couponDiscount": null,
  "pixDiscount": null,
  "total": null,
  "pixDiscountPercent": null,
  "installmentOptions": null,
  "canConfirm": null,
  "validationErrors": null,
} satisfies CheckoutPreview200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CheckoutPreview200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


