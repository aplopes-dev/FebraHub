
# UpdateCheckoutSessionRequest


## Properties

Name | Type
------------ | -------------
`selectedAddressId` | string
`shippingOptionId` | string
`paymentType` | [PaymentType](PaymentType.md)
`paymentMethodId` | string
`boletoCpf` | string

## Example

```typescript
import type { UpdateCheckoutSessionRequest } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "selectedAddressId": null,
  "shippingOptionId": null,
  "paymentType": null,
  "paymentMethodId": null,
  "boletoCpf": null,
} satisfies UpdateCheckoutSessionRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateCheckoutSessionRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


