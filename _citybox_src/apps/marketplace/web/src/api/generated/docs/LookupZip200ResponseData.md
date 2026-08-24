
# LookupZip200ResponseData


## Properties

Name | Type
------------ | -------------
`zipCode` | string
`street` | string
`neighborhood` | string
`city` | string
`state` | string

## Example

```typescript
import type { LookupZip200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "zipCode": null,
  "street": null,
  "neighborhood": null,
  "city": null,
  "state": null,
} satisfies LookupZip200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LookupZip200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


