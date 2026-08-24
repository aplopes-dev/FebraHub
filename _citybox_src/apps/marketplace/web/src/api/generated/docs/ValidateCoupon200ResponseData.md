
# ValidateCoupon200ResponseData


## Properties

Name | Type
------------ | -------------
`coupon` | [Coupon](Coupon.md)
`discountAmount` | number
`isValid` | boolean

## Example

```typescript
import type { ValidateCoupon200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "coupon": null,
  "discountAmount": null,
  "isValid": null,
} satisfies ValidateCoupon200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ValidateCoupon200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


