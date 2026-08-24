
# OrderStatusEntry


## Properties

Name | Type
------------ | -------------
`status` | [OrderStatus](OrderStatus.md)
`date` | Date
`location` | string

## Example

```typescript
import type { OrderStatusEntry } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "status": null,
  "date": null,
  "location": null,
} satisfies OrderStatusEntry

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OrderStatusEntry
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


