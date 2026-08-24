
# PaymentInput


## Properties

Name | Type
------------ | -------------
`type` | [PaymentType](PaymentType.md)
`paymentMethodId` | string
`cpf` | string

## Example

```typescript
import type { PaymentInput } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "paymentMethodId": null,
  "cpf": null,
} satisfies PaymentInput

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaymentInput
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


