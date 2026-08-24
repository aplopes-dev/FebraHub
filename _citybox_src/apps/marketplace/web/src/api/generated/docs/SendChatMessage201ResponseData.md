
# SendChatMessage201ResponseData


## Properties

Name | Type
------------ | -------------
`userMessage` | [ChatMessage](ChatMessage.md)
`agentMessage` | [ChatMessage](ChatMessage.md)

## Example

```typescript
import type { SendChatMessage201ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "userMessage": null,
  "agentMessage": null,
} satisfies SendChatMessage201ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SendChatMessage201ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


