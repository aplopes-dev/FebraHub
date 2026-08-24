
# RemoveCoupon200ResponseData


## Properties

Name | Type
------------ | -------------
`appliedCoupon` | [AppliedCoupon](AppliedCoupon.md)
`preview` | [CheckoutPreview](CheckoutPreview.md)

## Example

```typescript
import type { RemoveCoupon200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "appliedCoupon": null,
  "preview": null,
} satisfies RemoveCoupon200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RemoveCoupon200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


