
# AddressInput


## Properties

Name | Type
------------ | -------------
`label` | string
`zipCode` | string
`street` | string
`number` | string
`complement` | string
`neighborhood` | string
`city` | string
`state` | string
`isDefault` | boolean

## Example

```typescript
import type { AddressInput } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "label": null,
  "zipCode": null,
  "street": null,
  "number": null,
  "complement": null,
  "neighborhood": null,
  "city": null,
  "state": null,
  "isDefault": null,
} satisfies AddressInput

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AddressInput
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


