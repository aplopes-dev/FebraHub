
# AppliedCoupon


## Properties

Name | Type
------------ | -------------
`code` | string
`type` | [CouponType](CouponType.md)
`value` | number
`discountAmount` | number

## Example

```typescript
import type { AppliedCoupon } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "code": null,
  "type": null,
  "value": null,
  "discountAmount": null,
} satisfies AppliedCoupon

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AppliedCoupon
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


