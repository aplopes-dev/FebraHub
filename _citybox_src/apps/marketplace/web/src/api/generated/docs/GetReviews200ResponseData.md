
# GetReviews200ResponseData


## Properties

Name | Type
------------ | -------------
`averageRating` | number
`totalCount` | number
`distribution` | { [key: string]: number; }
`reviews` | [Array&lt;Review&gt;](Review.md)

## Example

```typescript
import type { GetReviews200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "averageRating": null,
  "totalCount": null,
  "distribution": null,
  "reviews": null,
} satisfies GetReviews200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetReviews200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


