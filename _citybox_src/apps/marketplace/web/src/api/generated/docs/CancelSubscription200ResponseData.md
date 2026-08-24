
# CancelSubscription200ResponseData


## Properties

Name | Type
------------ | -------------
`isActive` | boolean
`cancelledAt` | Date
`accessUntil` | Date

## Example

```typescript
import type { CancelSubscription200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "isActive": null,
  "cancelledAt": null,
  "accessUntil": null,
} satisfies CancelSubscription200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CancelSubscription200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


