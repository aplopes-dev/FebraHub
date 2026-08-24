
# GetShippingOptionsRequest


## Properties

Name | Type
------------ | -------------
`addressId` | string
`items` | [Array&lt;CartItemInput&gt;](CartItemInput.md)

## Example

```typescript
import type { GetShippingOptionsRequest } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "addressId": null,
  "items": null,
} satisfies GetShippingOptionsRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetShippingOptionsRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


