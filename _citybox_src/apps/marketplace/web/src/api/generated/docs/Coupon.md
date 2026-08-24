
# Coupon


## Properties

Name | Type
------------ | -------------
`code` | string
`description` | string
`type` | [CouponType](CouponType.md)
`value` | number
`expiry` | Date
`isApplicable` | boolean
`reason` | string

## Example

```typescript
import type { Coupon } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "code": null,
  "description": null,
  "type": null,
  "value": null,
  "expiry": null,
  "isApplicable": null,
  "reason": null,
} satisfies Coupon

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Coupon
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


