
# CreateOrder201ResponseData


## Properties

Name | Type
------------ | -------------
`order` | [Order](Order.md)
`payment` | [PaymentResult](PaymentResult.md)

## Example

```typescript
import type { CreateOrder201ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "order": null,
  "payment": null,
} satisfies CreateOrder201ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateOrder201ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


