
# Settings


## Properties

Name | Type
------------ | -------------
`pushOrdersEnabled` | boolean
`pushPromoEnabled` | boolean
`emailPromoEnabled` | boolean
`darkTheme` | boolean
`language` | string

## Example

```typescript
import type { Settings } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "pushOrdersEnabled": null,
  "pushPromoEnabled": null,
  "emailPromoEnabled": null,
  "darkTheme": null,
  "language": pt-BR,
} satisfies Settings

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Settings
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


