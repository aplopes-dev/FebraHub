
# CheckoutSession


## Properties

Name | Type
------------ | -------------
`selectedAddressId` | string
`shippingOptionId` | string
`appliedCoupon` | [AppliedCoupon](AppliedCoupon.md)
`paymentType` | [PaymentType](PaymentType.md)
`paymentMethodId` | string
`boletoCpf` | string
`canConfirm` | boolean

## Example

```typescript
import type { CheckoutSession } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "selectedAddressId": null,
  "shippingOptionId": null,
  "appliedCoupon": null,
  "paymentType": null,
  "paymentMethodId": null,
  "boletoCpf": null,
  "canConfirm": null,
} satisfies CheckoutSession

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CheckoutSession
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


