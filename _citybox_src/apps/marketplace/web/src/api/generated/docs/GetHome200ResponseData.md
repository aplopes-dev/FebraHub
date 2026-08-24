
# GetHome200ResponseData


## Properties

Name | Type
------------ | -------------
`sections` | [Array&lt;GetHome200ResponseDataSectionsInner&gt;](GetHome200ResponseDataSectionsInner.md)
`products` | [Array&lt;Product&gt;](Product.md)

## Example

```typescript
import type { GetHome200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "sections": null,
  "products": null,
} satisfies GetHome200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetHome200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


