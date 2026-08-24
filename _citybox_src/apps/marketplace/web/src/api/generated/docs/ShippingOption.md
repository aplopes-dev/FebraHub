
# ShippingOption


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`deliveryEstimate` | string
`deliveryEstimateDays` | number
`price` | number
`isExpress` | boolean

## Example

```typescript
import type { ShippingOption } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "deliveryEstimate": null,
  "deliveryEstimateDays": null,
  "price": null,
  "isExpress": null,
} satisfies ShippingOption

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ShippingOption
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


