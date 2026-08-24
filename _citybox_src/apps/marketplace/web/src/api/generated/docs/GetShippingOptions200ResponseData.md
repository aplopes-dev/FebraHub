
# GetShippingOptions200ResponseData


## Properties

Name | Type
------------ | -------------
`options` | [Array&lt;ShippingOption&gt;](ShippingOption.md)
`freeShippingMessage` | string

## Example

```typescript
import type { GetShippingOptions200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "options": null,
  "freeShippingMessage": null,
} satisfies GetShippingOptions200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetShippingOptions200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


