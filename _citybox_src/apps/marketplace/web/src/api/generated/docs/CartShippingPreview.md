
# CartShippingPreview


## Properties

Name | Type
------------ | -------------
`selectedOptionId` | string
`price` | number
`freeShippingMessage` | string

## Example

```typescript
import type { CartShippingPreview } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "selectedOptionId": null,
  "price": null,
  "freeShippingMessage": null,
} satisfies CartShippingPreview

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CartShippingPreview
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


