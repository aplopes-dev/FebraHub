
# ReturnDetail


## Properties

Name | Type
------------ | -------------
`returnId` | string
`orderId` | string
`status` | string
`item` | [CartItemInput](CartItemInput.md)
`reason` | [ReturnReason](ReturnReason.md)
`description` | string
`createdAt` | Date
`instructions` | string

## Example

```typescript
import type { ReturnDetail } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "returnId": null,
  "orderId": null,
  "status": null,
  "item": null,
  "reason": null,
  "description": null,
  "createdAt": null,
  "instructions": null,
} satisfies ReturnDetail

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReturnDetail
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


