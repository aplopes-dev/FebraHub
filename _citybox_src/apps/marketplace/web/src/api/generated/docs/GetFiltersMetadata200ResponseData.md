
# GetFiltersMetadata200ResponseData


## Properties

Name | Type
------------ | -------------
`brands` | Array&lt;string&gt;
`priceRange` | [GetFiltersMetadata200ResponseDataPriceRange](GetFiltersMetadata200ResponseDataPriceRange.md)
`sortOptions` | [Array&lt;GetFiltersMetadata200ResponseDataSortOptionsInner&gt;](GetFiltersMetadata200ResponseDataSortOptionsInner.md)
`ratingOptions` | Array&lt;number&gt;
`flags` | [Array&lt;GetFiltersMetadata200ResponseDataFlagsInner&gt;](GetFiltersMetadata200ResponseDataFlagsInner.md)

## Example

```typescript
import type { GetFiltersMetadata200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "brands": null,
  "priceRange": null,
  "sortOptions": null,
  "ratingOptions": null,
  "flags": null,
} satisfies GetFiltersMetadata200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetFiltersMetadata200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


