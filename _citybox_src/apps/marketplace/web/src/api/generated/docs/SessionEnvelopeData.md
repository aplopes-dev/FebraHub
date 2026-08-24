
# SessionEnvelopeData


## Properties

Name | Type
------------ | -------------
`isAuthenticated` | boolean
`accessToken` | string
`expiresIn` | number
`user` | [User](User.md)

## Example

```typescript
import type { SessionEnvelopeData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "isAuthenticated": null,
  "accessToken": null,
  "expiresIn": null,
  "user": null,
} satisfies SessionEnvelopeData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SessionEnvelopeData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


