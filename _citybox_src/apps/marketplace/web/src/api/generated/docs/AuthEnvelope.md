
# AuthEnvelope


## Properties

Name | Type
------------ | -------------
`data` | [AuthEnvelopeData](AuthEnvelopeData.md)

## Example

```typescript
import type { AuthEnvelope } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "data": null,
} satisfies AuthEnvelope

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuthEnvelope
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


