
# PaymentMethod


## Properties

Name | Type
------------ | -------------
`id` | string
`brand` | [CardBrand](CardBrand.md)
`lastFour` | string
`expiry` | string
`holderName` | string
`label` | string
`isDefault` | boolean

## Example

```typescript
import type { PaymentMethod } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "brand": null,
  "lastFour": null,
  "expiry": null,
  "holderName": null,
  "label": null,
  "isDefault": null,
} satisfies PaymentMethod

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaymentMethod
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


