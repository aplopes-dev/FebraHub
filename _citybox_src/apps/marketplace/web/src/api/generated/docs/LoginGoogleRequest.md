
# LoginGoogleRequest


## Properties

Name | Type
------------ | -------------
`idToken` | string
`hasSeenOnboarding` | boolean

## Example

```typescript
import type { LoginGoogleRequest } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "idToken": null,
  "hasSeenOnboarding": null,
} satisfies LoginGoogleRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LoginGoogleRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


