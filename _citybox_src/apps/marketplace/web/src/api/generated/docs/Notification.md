
# Notification


## Properties

Name | Type
------------ | -------------
`id` | string
`type` | string
`title` | string
`body` | string
`date` | Date
`isRead` | boolean
`deepLink` | string

## Example

```typescript
import type { Notification } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "type": null,
  "title": null,
  "body": null,
  "date": null,
  "isRead": null,
  "deepLink": null,
} satisfies Notification

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Notification
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


