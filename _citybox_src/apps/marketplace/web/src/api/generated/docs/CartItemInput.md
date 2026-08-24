
# CartItemInput


## Properties

Name | Type
------------ | -------------
`productId` | string
`quantity` | number

## Example

```typescript
import type { CartItemInput } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "quantity": null,
} satisfies CartItemInput

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CartItemInput
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


