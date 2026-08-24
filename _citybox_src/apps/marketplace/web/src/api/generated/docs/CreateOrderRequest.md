
# CreateOrderRequest


## Properties

Name | Type
------------ | -------------
`addressId` | string
`shippingOptionId` | string
`couponCode` | string
`payment` | [PaymentInput](PaymentInput.md)
`items` | [Array&lt;CartItemInput&gt;](CartItemInput.md)
`buyNow` | boolean

## Example

```typescript
import type { CreateOrderRequest } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "addressId": null,
  "shippingOptionId": null,
  "couponCode": null,
  "payment": null,
  "items": null,
  "buyNow": null,
} satisfies CreateOrderRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateOrderRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


